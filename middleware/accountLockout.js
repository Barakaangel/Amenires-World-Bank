/**
 * Account Lockout and Recovery System for Amenires World Bank
 * Progressive delays, lockout mechanisms, self-service and manual recovery
 */

const crypto = require('crypto');

/**
 * Lockout Configuration
 */
const LockoutConfig = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  PROGRESSIVE_DELAYS: [1000, 2000, 4000, 8000, 16000, 32000], // Exponential backoff
  PERMANENT_LOCKOUT_THRESHOLD: 10, // Attempts before permanent lockout
  IP_LOCKOUT_THRESHOLD: 20, // Attempts from same IP
  DEVICE_LOCKOUT_THRESHOLD: 10, // Attempts from same device
  LOCKOUT_RECOVERY_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  VIDEO_VERIFICATION_URL: 'https://video-verify.amenires.worldbank.com',
  BRANCH_LOCATIONS: {
    default: 'https://branch.amenires.worldbank.com'
  }
};

/**
 * Lockout States
 */
const LockoutStates = {
  ACTIVE: 'active',
  TEMPORARY_LOCKED: 'temporary_locked',
  PERMANENT_LOCKED: 'permanent_locked',
  AWAITING_RECOVERY: 'awaiting_recovery'
};

/**
 * Account Lockout Manager
 */
class AccountLockoutManager {
  constructor() {
    this.lockouts = new Map();
    this.ipLockouts = new Map();
    this.deviceLockouts = new Map();
  }

  /**
   * Check if account is locked
   */
  isAccountLocked(userId) {
    const lockout = this.lockouts.get(userId);
    if (!lockout) return false;

    if (lockout.type === 'permanent') {
      return true;
    }

    if (lockout.type === 'temporary' && lockout.expiresAt > Date.now()) {
      return true;
    }

    // Lockout expired
    this.lockouts.delete(userId);
    return false;
  }

  /**
   * Get account lockout status
   */
  getLockoutStatus(userId) {
    const lockout = this.lockouts.get(userId);
    if (!lockout) return null;

    return {
      type: lockout.type,
      reason: lockout.reason,
      expiresAt: lockout.expiresAt ? new Date(lockout.expiresAt).toISOString() : null,
      remainingTime: lockout.expiresAt ? Math.max(0, lockout.expiresAt - Date.now()) : null,
      attempts: lockout.attempts,
      recoveryOptions: lockout.recoveryOptions || []
    };
  }

  /**
   * Lock account temporarily
   */
  lockAccountTemporarily(userId, reason, duration = LockoutConfig.LOCKOUT_DURATION_MS) {
    this.lockouts.set(userId, {
      type: 'temporary',
      reason,
      lockedAt: Date.now(),
      expiresAt: Date.now() + duration,
      attempts: this._getFailedAttempts(userId)
    });
  }

  /**
   * Lock account permanently
   */
  lockAccountPermanently(userId, reason, recoveryOptions = []) {
    this.lockouts.set(userId, {
      type: 'permanent',
      reason,
      lockedAt: Date.now(),
      expiresAt: null,
      attempts: this._getFailedAttempts(userId),
      recoveryOptions: recoveryOptions.length > 0 ? recoveryOptions : [
        'video_verification',
        'in_person_verification',
        'document_submission'
      ]
    });
  }

  /**
   * Unlock account
   */
  unlockAccount(userId) {
    this.lockouts.delete(userId);
  }

  /**
   * Lock IP address
   */
  lockIP(ip, duration = 60 * 60 * 1000) { // 1 hour default
    this.ipLockouts.set(ip, {
      lockedAt: Date.now(),
      expiresAt: Date.now() + duration,
      reason: 'excessive_failed_attempts'
    });
  }

  /**
   * Check if IP is locked
   */
  isIPLocked(ip) {
    const lockout = this.ipLockouts.get(ip);
    if (!lockout) return false;

    if (lockout.expiresAt > Date.now()) {
      return true;
    }

    this.ipLockouts.delete(ip);
    return false;
  }

  /**
   * Lock device
   */
  lockDevice(deviceFingerprint, duration = 24 * 60 * 60 * 1000) { // 24 hours default
    this.deviceLockouts.set(deviceFingerprint, {
      lockedAt: Date.now(),
      expiresAt: Date.now() + duration,
      reason: 'excessive_failed_attempts'
    });
  }

  /**
   * Check if device is locked
   */
  isDeviceLocked(deviceFingerprint) {
    const lockout = this.deviceLockouts.get(deviceFingerprint);
    if (!lockout) return false;

    if (lockout.expiresAt > Date.now()) {
      return true;
    }

    this.deviceLockouts.delete(deviceFingerprint);
    return false;
  }

  /**
   * Record failed attempt
   */
  recordFailedAttempt(userId, ip, deviceFingerprint) {
    const key = `attempts:${userId}`;
    if (!this.lockouts.has(key)) {
      this.lockouts.set(key, { count: 0, attempts: [] });
    }

    const attemptsData = this.lockouts.get(key);
    attemptsData.count++;
    attemptsData.attempts.push({
      timestamp: Date.now(),
      ip,
      deviceFingerprint
    });

    // Clean old attempts (older than 24 hours)
    attemptsData.attempts = attemptsData.attempts.filter(
      a => Date.now() - a.timestamp < 24 * 60 * 60 * 1000
    );

    return attemptsData.count;
  }

  /**
   * Get failed attempt count
   */
  getFailedAttempts(userId) {
    return this._getFailedAttempts(userId);
  }

  /**
   * Get progressive delay for attempt
   */
  getProgressiveDelay(attemptNumber) {
    const delayIndex = Math.min(attemptNumber - 1, LockoutConfig.PROGRESSIVE_DELAYS.length - 1);
    return LockoutConfig.PROGRESSIVE_DELAYS[delayIndex];
  }

  /**
   * Clear failed attempts on success
   */
  clearFailedAttempts(userId) {
    const key = `attempts:${userId}`;
    this.lockouts.delete(key);
  }

  _getFailedAttempts(userId) {
    const key = `attempts:${userId}`;
    const attemptsData = this.lockouts.get(key);
    return attemptsData ? attemptsData.count : 0;
  }
}

const accountLockoutManager = new AccountLockoutManager();

/**
 * Account Recovery Manager
 */
class AccountRecoveryManager {
  constructor() {
    this.recoveryTokens = new Map();
    this.recoveryRequests = new Map();
  }

  /**
   * Generate recovery token
   */
  generateRecoveryToken(userId, recoveryType) {
    const token = crypto.randomBytes(32).toString('hex');
    const recoveryToken = {
      token,
      userId,
      type: recoveryType, // email_otp, sms_otp, video_verification, in_person, document
      createdAt: Date.now(),
      expiresAt: Date.now() + LockoutConfig.LOCKOUT_RECOVERY_TOKEN_EXPIRY,
      used: false,
      attempts: 0
    };

    this.recoveryTokens.set(token, recoveryToken);
    return recoveryToken;
  }

  /**
   * Verify recovery token
   */
  verifyRecoveryToken(token, recoveryType, inputCode = null) {
    const recoveryToken = this.recoveryTokens.get(token);

    if (!recoveryToken) {
      return { valid: false, reason: 'Token not found' };
    }

    if (recoveryToken.used) {
      return { valid: false, reason: 'Token already used' };
    }

    if (Date.now() > recoveryToken.expiresAt) {
      this.recoveryTokens.delete(token);
      return { valid: false, reason: 'Token expired' };
    }

    if (recoveryToken.type !== recoveryType) {
      return { valid: false, reason: 'Invalid recovery type' };
    }

    // For OTP-based recovery, verify the code
    if (inputCode && (recoveryType === 'email_otp' || recoveryType === 'sms_otp')) {
      recoveryToken.attempts++;
      if (recoveryToken.attempts > 3) {
        this.recoveryTokens.delete(token);
        return { valid: false, reason: 'Too many verification attempts' };
      }

      // In production, verify against stored OTP
      if (inputCode !== recoveryToken.otp) {
        return { valid: false, reason: 'Invalid verification code', remainingAttempts: 3 - recoveryToken.attempts };
      }
    }

    recoveryToken.used = true;
    return { valid: true, userId: recoveryToken.userId };
  }

  /**
   * Create recovery request
   */
  createRecoveryRequest(userId, recoveryMethod, metadata = {}) {
    const requestId = crypto.randomBytes(16).toString('hex');
    const request = {
      requestId,
      userId,
      method: recoveryMethod,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + LockoutConfig.LOCKOUT_RECOVERY_TOKEN_EXPIRY,
      metadata
    };

    this.recoveryRequests.set(requestId, request);
    return request;
  }

  /**
   * Update recovery request status
   */
  updateRecoveryStatus(requestId, status, additionalData = {}) {
    const request = this.recoveryRequests.get(requestId);
    if (!request) {
      return { success: false, reason: 'Request not found' };
    }

    request.status = status;
    request.updatedAt = Date.now();
    Object.assign(request, additionalData);

    return { success: true, request };
  }

  /**
   * Get recovery request
   */
  getRecoveryRequest(requestId) {
    return this.recoveryRequests.get(requestId);
  }

  /**
   * Get user recovery options
   */
  getRecoveryOptions(userId) {
    // In production, this would fetch from database
    return {
      selfService: [
        {
          type: 'email_otp',
          name: 'Email Verification',
          description: 'Receive a one-time code via email',
          available: true,
          icon: 'email'
        },
        {
          type: 'sms_otp',
          name: 'SMS Verification',
          description: 'Receive a one-time code via text message',
          available: true,
          icon: 'sms'
        },
        {
          type: 'security_questions',
          name: 'Security Questions',
          description: 'Answer your security questions',
          available: true,
          icon: 'question'
        },
        {
          type: 'biometric_reverification',
          name: 'Biometric Verification',
          description: 'Re-verify using your registered biometrics',
          available: true,
          icon: 'fingerprint'
        },
        {
          type: 'push_approval',
          name: 'Push Notification',
          description: 'Approve recovery via mobile app',
          available: true,
          icon: 'bell'
        }
      ],
      manualRecovery: [
        {
          type: 'video_verification',
          name: 'Video Call Verification',
          description: 'Video call with bank representative',
          url: LockoutConfig.VIDEO_VERIFICATION_URL,
          available: true,
          icon: 'video'
        },
        {
          type: 'in_person_verification',
          name: 'In-Person Verification',
          description: 'Visit a branch office for identity verification',
          locations: LockoutConfig.BRANCH_LOCATIONS,
          available: true,
          icon: 'store'
        },
        {
          type: 'document_submission',
          name: 'Document Submission',
          description: 'Submit notarized documents for verification',
          available: true,
          icon: 'document'
        }
      ],
      critical: [
        {
          type: 'forensic_review',
          name: 'Forensic Account Review',
          description: 'Complete security review of recent activity',
          required: true,
          icon: 'shield'
        },
        {
          type: 'device_deregistration',
          name: 'Device Deregistration',
          description: 'All registered devices will be removed',
          required: true,
          icon: 'smartphone'
        },
        {
          type: 'mandatory_mfa_reenrollment',
          name: 'MFA Re-enrollment',
          description: 'Must set up new two-factor authentication',
          required: true,
          icon: 'lock'
        }
      ]
    };
  }
}

const accountRecoveryManager = new AccountRecoveryManager();

/**
 * Self-Service Password Reset
 */
class SelfServiceRecovery {
  /**
   * Initiate email-based password reset
   */
  static initiateEmailReset(userEmail) {
    const otp = crypto.randomBytes(3).toString('hex').toUpperCase();
    // In production, send email with OTP
    return {
      method: 'email',
      otp,
      message: 'OTP sent to email',
      expiresIn: 300 // 5 minutes
    };
  }

  /**
   * Initiate SMS-based password reset
   */
  static initiateSMSReset(phoneNumber) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // In production, send SMS with OTP
    return {
      method: 'sms',
      otp,
      message: 'OTP sent via SMS',
      expiresIn: 300 // 5 minutes
    };
  }

  /**
   * Initiate security question reset
   */
  static initiateSecurityQuestionReset(userId, questions, answers) {
    // Verify answers
    const allCorrect = questions.every((q, i) => {
      return q.answer.toLowerCase().trim() === answers[i].toLowerCase().trim();
    });

    return {
      method: 'security_questions',
      verified: allCorrect,
      message: allCorrect ? 'Security questions verified' : 'One or more answers incorrect'
    };
  }

  /**
   * Initiate push notification approval
   */
  static initiatePushApproval(userId) {
    // In production, send push notification to mobile app
    return {
      method: 'push',
      message: 'Push notification sent to registered device',
      expiresIn: 600, // 10 minutes
      approvalCode: crypto.randomBytes(4).toString('hex').toUpperCase()
    };
  }
}

/**
 * Manual Recovery
 */
class ManualRecovery {
  /**
   * Initiate video call verification
   */
  static initiateVideoVerification(userId) {
    const videoRoomId = crypto.randomBytes(8).toString('hex');
    const verificationUrl = `${LockoutConfig.VIDEO_VERIFICATION_URL}/room/${videoRoomId}`;

    return {
      method: 'video_verification',
      roomId: videoRoomId,
      url: verificationUrl,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
      requiredDocuments: ['government_id', 'proof_of_address']
    };
  }

  /**
   * Initiate in-person verification
   */
  static initiateInPersonVerification(userId, branchLocation) {
    const appointmentId = crypto.randomBytes(8).toString('hex');

    return {
      method: 'in_person',
      appointmentId,
      branch: branchLocation,
      requiredDocuments: [
        'valid_government_id',
        'proof_of_address',
        'secondary_id'
      ],
      status: 'appointment_required'
    };
  }

  /**
   * Initiate document submission
   */
  static initiateDocumentSubmission(userId, documents) {
    const submissionId = crypto.randomBytes(16).toString('hex');

    return {
      method: 'document_submission',
      submissionId,
      uploadedDocuments: documents,
      status: 'pending_review',
      expectedProcessingTime: '2-3 business days'
    };
  }
}

/**
 * Account Takeover Recovery
 */
class AccountTakeoverRecovery {
  /**
   * Perform forensic review
   */
  static performForensicReview(userId, timeRange) {
    return {
      reviewId: crypto.randomBytes(16).toString('hex'),
      timeRange,
      actions: [
        'transaction_history_review',
        'login_history_review',
        'device_activity_review',
        'data_access_audit',
        'permission_changes_audit'
      ],
      status: 'in_progress',
      estimatedCompletion: '2-4 hours'
    };
  }

  /**
   * Deregister all devices
   */
  static deregisterAllDevices(userId) {
    return {
      action: 'device_deregistration',
      userId,
      devicesDeregistered: true,
      timestamp: new Date().toISOString(),
      nextLoginRequires: ['device_registration', 'mfa_setup']
    };
  }

  /**
   * Reset with mandatory MFA re-enrollment
   */
  static resetWithMFAReenrollment(userId, newPassword) {
    return {
      action: 'password_reset_with_mfa',
      userId,
      passwordReset: true,
      mfaRemoved: true,
      nextSteps: [
        'login_with_new_password',
        'setup_new_mfa_method',
        'verify_identity',
        'review_recent_activity'
      ],
      recoveryTokens: [],
      sessionTokensRevoked: true
    };
  }

  /**
   * Place credit bureau fraud alert
   */
  static placeFraudAlert(userId, userDetails) {
    return {
      action: 'fraud_alert_placement',
      bureaus: ['Experian', 'Equifax', 'TransUnion'],
      alertType: 'initial_90_day',
      userId,
      alertId: crypto.randomBytes(12).toString('hex').toUpperCase(),
      placedAt: new Date().toISOString(),
      expiresIn: '90 days'
    };
  }
}

/**
 * Handle login attempt with lockout logic
 */
const handleLoginAttempt = (userId, ip, deviceFingerprint, success) => {
  if (success) {
    accountLockoutManager.clearFailedAttempts(userId);
    return { allowed: true, lockoutStatus: null };
  }

  const attempts = accountLockoutManager.recordFailedAttempt(userId, ip, deviceFingerprint);
  const delay = accountLockoutManager.getProgressiveDelay(attempts);

  let lockoutStatus = null;
  let allowed = true;

  // Check thresholds
  if (attempts >= LockoutConfig.PERMANENT_LOCKOUT_THRESHOLD) {
    accountLockoutManager.lockAccountPermanently(userId, 'excessive_failed_attempts');
    lockoutStatus = accountLockoutManager.getLockoutStatus(userId);
    allowed = false;
  } else if (attempts >= LockoutConfig.MAX_FAILED_ATTEMPTS) {
    accountLockoutManager.lockAccountTemporarily(userId, 'failed_login_attempts');
    lockoutStatus = accountLockoutManager.getLockoutStatus(userId);
    allowed = false;
  }

  // Check IP lockout
  if (accountLockoutManager.getFailedAttempts(userId) >= LockoutConfig.IP_LOCKOUT_THRESHOLD) {
    accountLockoutManager.lockIP(ip);
  }

  return {
    allowed,
    lockoutStatus,
    attempts,
    delay,
    nextAttemptIn: allowed ? delay : null
  };
};

module.exports = {
  LockoutConfig,
  LockoutStates,
  AccountLockoutManager,
  accountLockoutManager,
  AccountRecoveryManager,
  accountRecoveryManager,
  SelfServiceRecovery,
  ManualRecovery,
  AccountTakeoverRecovery,
  handleLoginAttempt
};
