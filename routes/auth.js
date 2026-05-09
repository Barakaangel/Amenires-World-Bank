/**
 * Authentication Routes
 * Login, Signup, Password Reset, and 2FA
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const { generateSecurePassword, validatePasswordStrength, generateSecureToken, generateReferenceNumber } = require('../middleware/security');
const { auditLog } = require('../middleware/security');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
// Alias for signup/register
router.post('/signup', (req, res, next) => { req.url = '/register'; next(); });

router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 12 }).withMessage('Password must be at least 12 characters'),
  body('phone').matches(/^\+?[\d\s-]{10,20}$/).withMessage('Please provide a valid phone number'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('continent').isIn(['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica']).withMessage('Please provide a valid continent'),
  body('accountType').isIn(['individual', 'business', 'royalty', 'government', 'country_owner', 'continental']).withMessage('Invalid account type')
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

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      country,
      continent,
      accountType,
      address,
      businessName,
      businessType,
      title,
      royalHouse,
      governmentPosition,
      countryOwned,
      useGeneratedPassword
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email already exists'
      });
    }

    // Validate password strength
    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.valid && !useGeneratedPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Password does not meet security requirements',
        details: passwordStrength
      });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Determine role based on account type
    let role = 'customer';
    if (accountType === 'royalty') role = 'royal';
    if (accountType === 'business') role = 'business';
    if (accountType === 'government' || accountType === 'country_owner') role = 'vip';

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phone,
      country,
      continent,
      accountType,
      address,
      businessName,
      businessType,
      title,
      royalHouse,
      governmentPosition,
      countryOwned,
      role,
      isVerified: false,
      verificationToken,
      verificationExpires
    });

    // Generate JWT tokens
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE }
    );

    // Audit log
    await auditLog('USER_REGISTERED', user._id, {
      email: user.email,
      accountType: user.accountType,
      country: user.country
    });

    // Send response (in production, send verification email)
    res.status(201).json({
      status: 'success',
      message: 'Account created successfully. Please verify your email.',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accountType: user.accountType,
          role: user.role,
          isVerified: user.isVerified
        },
        token,
        refreshToken
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
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { email, password, twoFactorCode } = req.body;

    // Find user and include password for verification
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if account is locked
    if (user.isLocked && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        status: 'error',
        message: `Account is temporarily locked. Try again in ${remainingTime} minutes.`
      });
    }

    // Verify password
    const isPasswordValid = await user.correctPassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(403).json({
          status: 'error',
          message: 'Two-factor authentication code required',
          requireTwoFactor: true
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid two-factor authentication code'
        });
      }
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLoginAt = Date.now();
    user.lastLoginIP = req.ip;
    await user.save();

    // Generate JWT tokens
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE }
    );

    // Audit log
    await auditLog('USER_LOGIN', user._id, {
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent')
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
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', async (req, res) => {
  try {
    // In a real implementation, you would invalidate the token here
    // This is a simplified version
    
    res.status(200).json({
      status: 'success',
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during logout'
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(200).json({
      status: 'success',
      data: { token }
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid refresh token'
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        status: 'success',
        message: 'If an account exists with this email, a password reset link will be sent'
      });
    }

    // Generate password reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // In production, send email with reset link
    // For now, just return success
    console.log('Password reset token:', resetToken);

    res.status(200).json({
      status: 'success',
      message: 'If an account exists with this email, a password reset link will be sent'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while processing your request'
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
], async (req, res) => {
  try {
    const { token, password } = req.body;

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      });
    }

    // Validate password strength
    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.valid) {
      return res.status(400).json({
        status: 'error',
        message: 'Password does not meet security requirements',
        details: passwordStrength
      });
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Audit log
    await auditLog('PASSWORD_RESET', user._id, {
      email: user.email
    });

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while resetting your password'
    });
  }
});

/**
 * @route   POST /api/auth/generate-password
 * @desc    Generate a secure password
 * @access  Public
 */
router.post('/generate-password', async (req, res) => {
  try {
    const { length = 24 } = req.body;

    const password = generateSecurePassword(length);
    const strength = validatePasswordStrength(password);

    res.status(200).json({
      status: 'success',
      data: {
        password,
        strength
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while generating password'
    });
  }
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', [
  body('token').notEmpty().withMessage('Verification token is required')
], async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired verification token'
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // Audit log
    await auditLog('EMAIL_VERIFIED', user._id, {
      email: user.email
    });

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while verifying email'
    });
  }
});

/**
 * @route   POST /api/auth/2fa/setup
 * @desc    Setup two-factor authentication
 * @access  Private
 */
router.post('/2fa/setup', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Amenires World Bank (${user.email})`,
      issuer: 'Amenires World Bank'
    });

    // Save secret temporarily (not enabled yet)
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      status: 'success',
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while setting up 2FA'
    });
  }
});

/**
 * @route   POST /api/auth/2fa/verify
 * @desc    Verify and enable two-factor authentication
 * @access  Private
 */
router.post('/2fa/verify', [
  body('token').notEmpty().withMessage('2FA token is required')
], async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findById(req.user.id);

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid verification code'
      });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    
    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(generateSecureToken().substring(0, 8));
    }
    user.twoFactorBackupCodes = backupCodes;
    
    await user.save();

    // Audit log
    await auditLog('2FA_ENABLED', user._id, {
      email: user.email
    });

    res.status(200).json({
      status: 'success',
      message: 'Two-factor authentication enabled successfully',
      data: {
        backupCodes
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while verifying 2FA'
    });
  }
});

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    Disable two-factor authentication
 * @access  Private
 */
router.post('/2fa/disable', [
  body('token').notEmpty().withMessage('2FA token is required')
], async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findById(req.user.id);

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        status: 'error',
        message: 'Two-factor authentication is not enabled'
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid verification code'
      });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    await user.save();

    // Audit log
    await auditLog('2FA_DISABLED', user._id, {
      email: user.email
    });

    res.status(200).json({
      status: 'success',
      message: 'Two-factor authentication disabled successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while disabling 2FA'
    });
  }
});

module.exports = router;
