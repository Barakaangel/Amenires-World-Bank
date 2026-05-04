/**
 * Enhanced Authentication Routes with All Security Features
 * Combines MFA, fraud detection, logging, lockout, and recovery
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const { generateSecurePassword, validatePasswordStrength, generateSecureToken } = require('../middleware/security');
const {
  generateTOTPSecret,
  generateTOTPQRCode,
  verifyTOTP,
  generateBackupCodes,
  generateSMSOTP,
  generatePIN,
  generateSecurityQuestions,
  generateBiometricChallenge,
  verifyBiometricResponse,
  captureBehavioralBiometrics,
  generateDeviceProfile,
  verifyLocation,
  calculateRiskScore,
  determineAuthLevel
} = require('../middleware/mfa');
const {
  validatePassword,
  hashPasswordArgon2,
  verifyPasswordArgon2,
  sessionManager,
  generateCAPTCHA,
  verifyCAPTCHA
} = require('../middleware/advancedSecurity');
const {
  checkVelocityLimit,
  detectBot,
  detectImpossibleTravel,
  detectMalware,
  generateFraudReport
} = require('../middleware/fraudDetection');
const {
  accountLockoutManager,
  accountRecoveryManager,
  SelfServiceRecovery,
  ManualRecovery,
  AccountTakeoverRecovery,
  handleLoginAttempt
} = require('../middleware/accountLockout');
const {
  logLoginEvent,
  logSecurityEvent,
  logAuditEvent,
  logBehavioralData,
  logPrivilegedAccess
} = require('../middleware/logging');

const router = express.Router();

// Store CAPTCHAs
const storedCaptchas = new Map();

/**
 * @route   POST /api/auth/v2/login
 * @desc    Enhanced login with full security stack
 * @access  Public
 */
router.post('/v2/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  body('captcha').notEmpty().withMessage('CAPTCHA is required'),
  body('deviceProfile').optional(),
  body('location').optional(),
  body('behavioralData').optional()
], async (req, res) => {
  const correlationId = crypto.randomBytes(16).toString('hex');
  const startTime = Date.now();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await logLoginEvent({
        result: 'failure',
        email: req.body.email,
        ip: req.ip,
        failureReason: 'Validation failed',
        correlationId
      });
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, captcha, deviceProfile, location, behavioralData, mfaCode, mfaMethod } = req.body;

    // Verify CAPTCHA
    const captchaResult = verifyCAPTCHA(req.body.captchaId, captcha, storedCaptchas);
    if (!captchaResult.valid) {
      await logSecurityEvent({
        severity: 'low',
        category: 'authentication',
        userId: null,
        ip: req.ip,
        description: 'Invalid CAPTCHA during login',
        correlationId
      });
      return res.status(400).json({
        status: 'error',
        message: 'Invalid CAPTCHA',
        captchaError: captchaResult.reason
      });
    }

    // Fraud detection
    const fraudReport = generateFraudReport(req);
    if (fraudReport.recommendedAction === 'block') {
      await logSecurityEvent({
        severity: 'critical',
        category: 'fraud',
        userId: null,
        ip: req.ip,
        description: 'Fraud detected, blocking login',
        threatDetails: fraudReport,
        blocked: true,
        correlationId
      });
      accountLockoutManager.lockIP(req.ip, 60 * 60 * 1000); // 1 hour
      return res.status(403).json({
        status: 'error',
        message: 'Login blocked due to suspicious activity'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      await logLoginEvent({
        result: 'failure',
        email: req.body.email,
        ip: req.ip,
        failureReason: 'User not found',
        fraudScore: fraudReport.overallRiskScore,
        correlationId
      });
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check lockout
    if (accountLockoutManager.isAccountLocked(user._id)) {
      const lockoutStatus = accountLockoutManager.getLockoutStatus(user._id);
      await logSecurityEvent({
        severity: 'high',
        category: 'authentication',
        userId: user._id,
        ip: req.ip,
        description: 'Login attempt on locked account',
        threatDetails: lockoutStatus,
        correlationId
      });
      return res.status(423).json({
        status: 'error',
        message: 'Account is locked',
        lockoutStatus
      });
    }

    // Check IP lockout
    if (accountLockoutManager.isIPLocked(req.ip)) {
      await logSecurityEvent({
        severity: 'high',
        category: 'authentication',
        userId: user._id,
        ip: req.ip,
        description: 'IP locked',
        correlationId
      });
      return res.status(403).json({
        status: 'error',
        message: 'Your IP has been temporarily blocked'
      });
    }

    // Generate device profile
    const profile = generateDeviceProfile(req);

    // Log behavioral data if provided
    if (behavioralData) {
      await logBehavioralData({
        userId: user._id,
        sessionId: null,
        ip: req.ip,
        ...behavioralData
      });
    }

    // Verify password
    const isPasswordValid = await verifyPasswordArgon2(user.password, password);

    if (!isPasswordValid) {
      const lockoutResult = handleLoginAttempt(user._id, req.ip, profile.deviceFingerprint.hash, false);

      await logLoginEvent({
        result: 'failure',
        userId: user._id,
        email: user.email,
        ip: req.ip,
        failureReason: 'Invalid password',
        attemptCount: lockoutResult.attempts,
        fraudScore: fraudReport.overallRiskScore,
        correlationId
      });

      if (lockoutResult.lockoutStatus) {
        await logSecurityEvent({
          severity: 'high',
          category: 'authentication',
          userId: user._id,
          ip: req.ip,
          description: 'Account locked due to failed attempts',
          threatDetails: lockoutResult.lockoutStatus,
          correlationId
        });
      }

      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
        lockoutStatus: lockoutResult.lockoutStatus,
        nextAttemptIn: lockoutResult.nextAttemptIn
      });
    }

    // Check MFA requirements
    const authLevel = determineAuthLevel(fraudReport.overallRiskScore);
    const mfaRequired = user.twoFactorEnabled || authLevel.level !== 'minimal';

    if (mfaRequired && !mfaCode) {
      return res.status(403).json({
        status: 'error',
        message: 'Multi-factor authentication required',
        mfaRequired: true,
        availableMethods: ['totp', 'sms', 'biometric', 'security_key'],
        authLevel: authLevel.level,
        riskScore: fraudReport.overallRiskScore
      });
    }

    // Verify MFA if provided
    if (mfaRequired && mfaCode) {
      let mfaValid = false;

      if (mfaMethod === 'totp' && user.twoFactorEnabled) {
        mfaValid = verifyTOTP(user.twoFactorSecret, mfaCode);
      } else if (mfaMethod === 'sms') {
        // In production, verify against sent OTP
        mfaValid = mfaCode.length === 6 && /^\d{6}$/.test(mfaCode);
      } else if (mfaMethod === 'biometric' && user.biometricTemplate) {
        mfaValid = verifyBiometricResponse(null, mfaCode, user.biometricTemplate);
      }

      if (!mfaValid) {
        await logSecurityEvent({
          severity: 'medium',
          category: 'authentication',
          userId: user._id,
          ip: req.ip,
          description: 'Invalid MFA code',
          threatDetails: { method: mfaMethod },
          correlationId
        });

        const lockoutResult = handleLoginAttempt(user._id, req.ip, profile.deviceFingerprint.hash, false);

        return res.status(401).json({
          status: 'error',
          message: 'Invalid multi-factor authentication code',
          lockoutStatus: lockoutResult.lockoutStatus
        });
      }
    }

    // Clear failed attempts on successful login
    handleLoginAttempt(user._id, req.ip, profile.deviceFingerprint.hash, true);

    // Check location
    if (location) {
      const locationCheck = verifyLocation(req, user.allowedLocations);
      if (!locationCheck.verified) {
        await logSecurityEvent({
          severity: 'medium',
          category: 'authentication',
          userId: user._id,
          ip: req.ip,
          description: 'Location verification failed',
          threatDetails: locationCheck,
          correlationId
        });

        return res.status(403).json({
          status: 'error',
          message: 'Location verification failed',
          locationCheck
        });
      }
    }

    // Create session
    const session = sessionManager.createSession(user._id, profile, req);

    // Update user
    user.lastLoginAt = Date.now();
    user.lastLoginIP = req.ip;
    user.lastLoginLocation = location;
    await user.save();

    // Generate tokens
    const token = jwt.sign(
      { id: user._id, sessionId: session.sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user._id, sessionId: session.sessionId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '24h' }
    );

    // Log successful login
    await logLoginEvent({
      result: 'success',
      userId: user._id,
      email: user.email,
      authenticationMethod: mfaMethod || 'password',
      mfaChallengeDetails: mfaRequired ? { method: mfaMethod } : null,
      ip: req.ip,
      deviceFingerprint: profile.deviceFingerprint.hash,
      deviceId: profile.deviceFingerprint.hash,
      userAgent: req.get('user-agent'),
      sessionTokenId: session.sessionId,
      riskScore: fraudReport.overallRiskScore,
      captchaResult: { passed: true },
      correlationId
    });

    await logAuditEvent({
      action: 'LOGIN_SUCCESS',
      userId: user._id,
      sessionId: session.sessionId,
      ip: req.ip,
      result: 'success'
    });

    const processingTime = Date.now() - startTime;
    await logPerformance({
      endpoint: '/api/auth/v2/login',
      method: 'POST',
      responseTime: processingTime,
      statusCode: 200,
      userId: user._id,
      sessionId: session.sessionId
    });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accountType: user.accountType,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled
        },
        token,
        refreshToken,
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
        riskScore: fraudReport.overallRiskScore,
        authLevel: authLevel.level
      }
    });
  } catch (error) {
    console.error('Enhanced login error:', error);
    await logError({
      type: 'authentication_error',
      code: 'ENHANCED_LOGIN_FAILED',
      message: error.message,
      stack: error.stack,
      endpoint: '/api/auth/v2/login',
      method: 'POST',
      ip: req.ip,
      correlationId
    });

    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login'
    });
  }
});

/**
 * @route   GET /api/auth/v2/captcha
 * @desc    Generate new CAPTCHA
 * @access  Public
 */
router.get('/v2/captcha', async (req, res) => {
  try {
    const captcha = generateCAPTCHA();
    storedCaptchas.set(captcha.id, captcha);

    res.status(200).json({
      status: 'success',
      data: {
        captchaId: captcha.id,
        imageData: captcha.imageData,
        expiresAt: captcha.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate CAPTCHA'
    });
  }
});

/**
 * @route   POST /api/auth/v2/register
 * @desc    Enhanced registration with all security checks
 * @access  Public
 */
router.post('/v2/register', [
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 12 }),
  body('phone').matches(/^\+?[\d\s-]{10,20}$/),
  body('captcha').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, captcha, ...otherFields } = req.body;

    // Verify CAPTCHA
    const captchaResult = verifyCAPTCHA(req.body.captchaId, captcha, storedCaptchas);
    if (!captchaResult.valid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid CAPTCHA'
      });
    }

    // Check fraud
    const fraudReport = generateFraudReport(req);
    if (fraudReport.recommendedAction === 'block') {
      await logSecurityEvent({
        severity: 'critical',
        category: 'fraud',
        userId: null,
        ip: req.ip,
        description: 'Fraud detected during registration',
        threatDetails: fraudReport,
        blocked: true
      });
      return res.status(403).json({
        status: 'error',
        message: 'Registration blocked due to suspicious activity'
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password, []);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        status: 'error',
        message: 'Password does not meet security requirements',
        details: passwordValidation
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email already exists'
      });
    }

    // Hash password with Argon2
    const hashedPassword = await hashPasswordArgon2(password);

    // Create user
    const user = await User.create({
      ...otherFields,
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      verificationToken: crypto.randomBytes(32).toString('hex'),
      verificationExpires: Date.now() + 24 * 60 * 60 * 1000
    });

    // Generate security questions
    const questions = generateSecurityQuestions();

    await logAuditEvent({
      action: 'USER_REGISTERED',
      userId: user._id,
      email: user.email,
      result: 'success'
    });

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        },
        securityQuestions: questions
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during registration'
    });
  }
});

/**
 * @route   POST /api/auth/v2/recovery
 * @desc    Initiate account recovery
 * @access  Public
 */
router.post('/v2/recovery', [
  body('email').isEmail(),
  body('method').isIn(['email_otp', 'sms_otp', 'security_questions', 'video_verification', 'in_person'])
], async (req, res) => {
  try {
    const { email, method } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No account found with this email'
      });
    }

    // Get recovery options
    const recoveryOptions = accountRecoveryManager.getRecoveryOptions(user._id);

    // Generate recovery token
    const recoveryToken = accountRecoveryManager.generateRecoveryToken(user._id, method);

    let result;

    if (method === 'email_otp') {
      result = SelfServiceRecovery.initiateEmailReset(email);
    } else if (method === 'sms_otp') {
      result = SelfServiceRecovery.initiateSMSReset(user.phone);
    } else if (method === 'video_verification') {
      result = ManualRecovery.initiateVideoVerification(user._id);
    } else if (method === 'in_person') {
      result = ManualRecovery.initiateInPersonVerification(user._id, 'default');
    }

    await logAuditEvent({
      action: 'RECOVERY_INITIATED',
      userId: user._id,
      method,
      result: 'success'
    });

    res.status(200).json({
      status: 'success',
      message: 'Recovery initiated',
      data: {
        method,
        recoveryToken: recoveryToken.token,
        expiresIn: recoveryToken.expiresAt - Date.now(),
        recoveryOptions,
        result
      }
    });
  } catch (error) {
    console.error('Recovery error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during recovery initiation'
    });
  }
});

/**
 * @route   POST /api/auth/v2/recovery/verify
 * @desc    Verify and complete recovery
 * @access  Public
 */
router.post('/v2/recovery/verify', [
  body('token').notEmpty(),
  body('verificationCode').notEmpty(),
  body('newPassword').isLength({ min: 12 })
], async (req, res) => {
  try {
    const { token, verificationCode, newPassword, mfaSetup } = req.body;

    // Verify recovery token
    const verification = accountRecoveryManager.verifyRecoveryToken(token, 'email_otp', verificationCode);
    if (!verification.valid) {
      await logSecurityEvent({
        severity: 'medium',
        category: 'authentication',
        userId: verification.userId,
        ip: req.ip,
        description: 'Invalid recovery verification',
        threatDetails: { reason: verification.reason }
      });
      return res.status(400).json({
        status: 'error',
        message: verification.reason
      });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword, []);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        status: 'error',
        message: 'Password does not meet security requirements',
        details: passwordValidation
      });
    }

    // Get user
    const user = await User.findById(verification.userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Reset password
    user.password = await hashPasswordArgon2(newPassword);
    user.passwordChangedAt = Date.now();

    // Clear MFA for security
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;

    // Reset lockout
    accountLockoutManager.unlockAccount(user._id);
    accountLockoutManager.clearFailedAttempts(user._id);

    // Deregister all devices
    AccountTakeoverRecovery.deregisterAllDevices(user._id);

    await user.save();

    await logAuditEvent({
      action: 'RECOVERY_COMPLETED',
      userId: user._id,
      method: 'password_reset',
      result: 'success'
    });

    await logPrivilegedAccess({
      adminUserId: null,
      targetUserId: user._id,
      action: 'password_reset_via_recovery',
      resource: 'user_credentials',
      resourceId: user._id,
      ip: req.ip,
      reason: 'Account recovery'
    });

    res.status(200).json({
      status: 'success',
      message: 'Account recovered successfully',
      data: {
        requireMFASetup: true,
        requireDeviceRegistration: true,
        nextSteps: [
          'Login with new password',
          'Set up multi-factor authentication',
          'Register your device',
          'Review account activity'
        ]
      }
    });
  } catch (error) {
    console.error('Recovery verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during recovery verification'
    });
  }
});

/**
 * @route   GET /api/auth/v2/lockout-status/:userId
 * @desc    Get lockout status for a user
 * @access  Private
 */
router.get('/v2/lockout-status/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const lockoutStatus = accountLockoutManager.getLockoutStatus(userId);
    const ipLocked = accountLockoutManager.isIPLocked(req.ip);
    const failedAttempts = accountLockoutManager.getFailedAttempts(userId);

    res.status(200).json({
      status: 'success',
      data: {
        lockoutStatus,
        ipLocked,
        failedAttempts,
        recoveryOptions: accountLockoutManager.isAccountLocked(userId) ?
          accountRecoveryManager.getRecoveryOptions(userId) : null
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve lockout status'
    });
  }
});

module.exports = router;
