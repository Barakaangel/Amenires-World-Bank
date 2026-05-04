/**
 * Advanced Security Middleware for Amenires World Bank
 * Credential Management, Session Security, Anti-Fraud, Infrastructure Hardening
 */

const crypto = require('crypto');
const argon2 = require('argon2');
const zxcvbn = require('zxcvbn');
const jwt = require('jsonwebtoken');

/**
 * Password Policies
 */
const PasswordPolicies = {
  MIN_LENGTH: 12,
  MAX_LENGTH: 128,
  MIN_UPPERCASE: 1,
  MIN_LOWERCASE: 1,
  MIN_DIGITS: 1,
  MIN_SPECIAL: 1,
  MIN_ENTROPY: 60,
  PASSWORD_HISTORY: 12,
  BREACH_CHECK_ENABLED: true,
  EXPIRY_DAYS: 90,
  COMMON_PASSWORDS: [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'monkey', 'master', 'dragon', '111111', 'baseball',
    'iloveyou', 'trustno1', 'sunshine', 'princess', 'admin'
  ],
  DICTIONARY_WORDS: ['hello', 'welcome', 'amenires', 'banking', 'account']
};

/**
 * Breached Password Database (simplified example)
 * In production, integrate with Have I Been Pwned API
 */
const breachedPasswordsDB = new Set([
  'password123', 'qwerty123', 'admin123', 'letmein', 'welcome1'
]);

/**
 * Check if password is in breached database
 */
const isPasswordBreached = (password) => {
  // In production, use Have I Been Pwned API
  return breachedPasswordsDB.has(password.toLowerCase());
};

/**
 * Validate password with comprehensive checks
 */
const validatePassword = (password, oldPasswords = []) => {
  const errors = [];
  const warnings = [];

  // Length check
  if (password.length < PasswordPolicies.MIN_LENGTH) {
    errors.push(`Password must be at least ${PasswordPolicies.MIN_LENGTH} characters`);
  }
  if (password.length > PasswordPolicies.MAX_LENGTH) {
    errors.push(`Password must not exceed ${PasswordPolicies.MAX_LENGTH} characters`);
  }

  // Complexity checks
  const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
  const lowercaseCount = (password.match(/[a-z]/g) || []).length;
  const digitCount = (password.match(/\d/g) || []).length;
  const specialCount = (password.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g) || []).length;

  if (uppercaseCount < PasswordPolicies.MIN_UPPERCASE) {
    errors.push(`Password must contain at least ${PasswordPolicies.MIN_UPPERCASE} uppercase letter(s)`);
  }
  if (lowercaseCount < PasswordPolicies.MIN_LOWERCASE) {
    errors.push(`Password must contain at least ${PasswordPolicies.MIN_LOWERCASE} lowercase letter(s)`);
  }
  if (digitCount < PasswordPolicies.MIN_DIGITS) {
    errors.push(`Password must contain at least ${PasswordPolicies.MIN_DIGITS} digit(s)`);
  }
  if (specialCount < PasswordPolicies.MIN_SPECIAL) {
    errors.push(`Password must contain at least ${PasswordPolicies.MIN_SPECIAL} special character(s)`);
  }

  // Entropy check
  const entropy = calculateEntropy(password);
  if (entropy < PasswordPolicies.MIN_ENTROPY) {
    errors.push(`Password entropy is too low (${entropy.toFixed(1)} < ${PasswordPolicies.MIN_ENTROPY})`);
  }

  // Common password check
  const lowerPassword = password.toLowerCase();
  if (PasswordPolicies.COMMON_PASSWORDS.some(cp => lowerPassword.includes(cp))) {
    errors.push('Password contains common words or patterns');
  }

  // Dictionary word check
  if (PasswordPolicies.DICTIONARY_WORDS.some(dw => lowerPassword.includes(dw))) {
    warnings.push('Password contains dictionary words');
  }

  // Breach check
  if (PasswordPolicies.BREACH_CHECK_ENABLED && isPasswordBreached(password)) {
    errors.push('This password has been found in data breaches');
  }

  // Password history check
  if (oldPasswords.length > 0) {
    for (const oldPassword of oldPasswords) {
      if (checkPasswordSimilarity(password, oldPassword) > 0.8) {
        errors.push('New password is too similar to a previous password');
        break;
      }
    }
  }

  // Use zxcvbn for strength estimation
  const zxcvbnResult = zxcvbn(password);
  if (zxcvbnResult.score < 3) {
    warnings.push(`Password is weak: ${zxcvbnResult.feedback.warning || 'Consider making it longer and more complex'}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    strength: zxcvbnResult.score,
    entropy,
    crackTime: zxcvbnResult.crack_times_display.offline_slow_hashing_1e4_per_second
  };
};

/**
 * Calculate password entropy
 */
const calculateEntropy = (password) => {
  let charset = 0;
  if (/[a-z]/.test(password)) charset += 26;
  if (/[A-Z]/.test(password)) charset += 26;
  if (/\d/.test(password)) charset += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charset += 32;

  return password.length * Math.log2(charset);
};

/**
 * Check password similarity
 */
const checkPasswordSimilarity = (password1, password2) => {
  if (password1 === password2) return 1;

  const len1 = password1.length;
  const len2 = password2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = password1[i - 1] === password2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return 1 - (matrix[len1][len2] / maxLen);
};

/**
 * Hash password with Argon2id
 */
const hashPasswordArgon2 = async (password) => {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
      hashLength: 32
    });
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

/**
 * Verify password with Argon2id
 */
const verifyPasswordArgon2 = async (hash, password) => {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
};

/**
 * Generate client certificate
 */
const generateClientCertificate = (userId) => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  const certificate = {
    version: 'X509v3',
    serialNumber: crypto.randomBytes(16).toString('hex'),
    subject: `CN=${userId}, O=Amenires World Bank, C=US`,
    issuer: 'CN=Amenires World Bank CA, O=Amenires World Bank, C=US',
    validFrom: new Date(),
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    publicKey,
    extensions: [
      { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
      { name: 'extKeyUsage', clientAuth: true },
      { name: 'subjectAltName', value: `URI:urn:uuid:${userId}` }
    ]
  };

  return {
    certificate,
    privateKey,
    publicKey
  };
};

/**
 * Generate FIDO2/WebAuthn credential options
 */
const generateWebAuthnOptions = (userId, userEmail) => {
  return {
    rp: {
      name: 'Amenires World Bank',
      id: 'amenires.worldbank.com'
    },
    user: {
      id: Buffer.from(userId).toString('base64'),
      name: userEmail,
      displayName: userEmail
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },  // ES256
      { type: 'public-key', alg: -257 } // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required'
    },
    timeout: 60000,
    excludeCredentials: [],
    attestation: 'direct'
  };
};

/**
 * Generate WebAuthn assertion options
 */
const generateWebAuthnAssertionOptions = (allowedCredentials) => {
  return {
    challenge: crypto.randomBytes(32).toString('base64'),
    timeout: 60000,
    rpId: 'amenires.worldbank.com',
    allowCredentials: allowedCredentials.map(cred => ({
      type: 'public-key',
      id: cred.credentialId
    })),
    userVerification: 'required'
  };
};

/**
 * Session Management
 */
class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.activeDevices = new Map();
  }

  /**
   * Create session
   */
  createSession(userId, deviceProfile, req) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const session = {
      sessionId,
      userId,
      deviceProfile,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes inactivity timeout
      absoluteExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours absolute
      ip: req.ip,
      userAgent: req.get('user-agent'),
      location: req.body.location || null,
      isBound: true,
      tokenRotationCount: 0
    };

    this.sessions.set(sessionId, session);
    this.addActiveDevice(userId, deviceProfile, sessionId);

    return session;
  }

  /**
   * Get session
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check expiration
    const now = Date.now();
    if (now > session.expiresAt || now > session.absoluteExpiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivityAt = now;
    session.expiresAt = now + 15 * 60 * 1000;

    return session;
  }

  /**
   * Destroy session
   */
  destroySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.removeActiveDevice(session.userId, sessionId);
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Destroy all user sessions
   */
  destroyAllUserSessions(userId) {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
    this.activeDevices.delete(userId);
  }

  /**
   * Add active device
   */
  addActiveDevice(userId, deviceProfile, sessionId) {
    if (!this.activeDevices.has(userId)) {
      this.activeDevices.set(userId, new Map());
    }
    const userDevices = this.activeDevices.get(userId);
    userDevices.set(sessionId, deviceProfile);

    // Enforce concurrent session limit (max 3 devices)
    if (userDevices.size > 3) {
      const oldestSession = Array.from(userDevices.keys())[0];
      this.destroySession(oldestSession);
      userDevices.delete(oldestSession);
    }
  }

  /**
   * Remove active device
   */
  removeActiveDevice(userId, sessionId) {
    const userDevices = this.activeDevices.get(userId);
    if (userDevices) {
      userDevices.delete(sessionId);
      if (userDevices.size === 0) {
        this.activeDevices.delete(userId);
      }
    }
  }

  /**
   * Check session hijacking
   */
  checkSessionHijacking(session, req) {
    const anomalies = [];

    // IP change detection
    if (session.ip !== req.ip) {
      anomalies.push({ type: 'ip_change', old: session.ip, new: req.ip });
    }

    // User-agent change
    if (session.userAgent !== req.get('user-agent')) {
      anomalies.push({ type: 'user_agent_change', detected: true });
    }

    // Impossible travel detection
    if (session.location && req.body.location) {
      const distance = calculateDistance(
        session.location.lat,
        session.location.lng,
        req.body.location.lat,
        req.body.location.lng
      );
      const timeDiff = (Date.now() - session.lastActivityAt) / 1000 / 3600; // hours
      const speed = distance / timeDiff; // km/h

      if (speed > 1000) { // Supersonic speed = impossible
        anomalies.push({ type: 'impossible_travel', speed, distance, timeDiff });
      }
    }

    return {
      isHijacked: anomalies.length > 0,
      anomalies
    };
  }

  /**
   * Rotate access token
   */
  rotateAccessToken(session) {
    session.tokenRotationCount++;

    // Generate new access token
    const accessToken = jwt.sign(
      { sessionId: session.sessionId, userId: session.userId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return accessToken;
  }

  /**
   * Get session statistics
   */
  getSessionStats(userId) {
    const userSessions = [];
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        userSessions.push({
          sessionId: sessionId.substring(0, 16) + '...',
          device: session.deviceProfile.platform,
          ip: session.ip,
          lastActivity: new Date(session.lastActivityAt).toISOString(),
          createdAt: new Date(session.createdAt).toISOString()
        });
      }
    }

    return {
      activeSessions: userSessions.length,
      sessions: userSessions
    };
  }
}

/**
 * Calculate distance between two points
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Generate CAPTCHA challenge
 */
const generateCAPTCHA = () => {
  const text = crypto.randomBytes(4).toString('hex').substring(0, 6).toUpperCase();
  const imageData = generateCAPTCHAImage(text);

  return {
    id: crypto.randomBytes(16).toString('hex'),
    text,
    imageData,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  };
};

/**
 * Generate CAPTCHA image (simplified)
 */
const generateCAPTCHAImage = (text) => {
  // In production, use canvas or sharp library to generate real image
  // This is a placeholder
  return {
    type: 'image/png',
    data: Buffer.from(text).toString('base64'),
    width: 200,
    height: 50
  };
};

/**
 * Verify CAPTCHA
 */
const verifyCAPTCHA = (captchaId, userInput, storedCaptchas) => {
  const captcha = storedCaptchas.get(captchaId);
  if (!captcha) return { valid: false, reason: 'CAPTCHA not found' };

  if (Date.now() > captcha.expiresAt) {
    storedCaptchas.delete(captchaId);
    return { valid: false, reason: 'CAPTCHA expired' };
  }

  if (captcha.text !== userInput.toUpperCase()) {
    return { valid: false, reason: 'Invalid CAPTCHA' };
  }

  storedCaptchas.delete(captchaId);
  return { valid: true };
};

/**
 * Detect malicious environment
 */
const detectMaliciousEnvironment = (req) => {
  const threats = [];

  // Check for proxies/VPNs
  const ip = req.ip;
  const privateIPRanges = ['127.', '10.', '192.168.', '172.16.'];
  if (!privateIPRanges.some(range => ip.startsWith(range))) {
    // Could be a proxy (in production, use IP reputation service)
    threats.push({ type: 'suspicious_ip', ip });
  }

  // Check for unusual user-agent
  const ua = req.get('user-agent') || '';
  if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
    threats.push({ type: 'bot_detected', userAgent: ua });
  }

  // Check for missing headers (indicates request tampering)
  if (!req.get('accept') || !req.get('accept-language')) {
    threats.push({ type: 'missing_headers', detected: true });
  }

  // Check for request timing (too fast = automated)
  const requestTime = parseInt(req.get('x-request-time') || '0');
  const processingTime = Date.now() - requestTime;
  if (processingTime < 100) {
    threats.push({ type: 'automated_request', processingTime });
  }

  return {
    isMalicious: threats.length > 0,
    threats,
    riskLevel: threats.length === 0 ? 'low' : threats.length === 1 ? 'medium' : 'high'
  };
};

/**
 * Generate progressive delay
 */
const getProgressiveDelay = (attemptCount) => {
  const delays = [1000, 2000, 4000, 8000, 16000, 32000, 64000]; // Exponential backoff
  const maxDelay = delays[delays.length - 1];
  const delay = delays[Math.min(attemptCount - 1, delays.length - 1)];
  return Math.min(delay, maxDelay);
};

// Export singleton instance
const sessionManager = new SessionManager();

module.exports = {
  PasswordPolicies,
  validatePassword,
  calculateEntropy,
  checkPasswordSimilarity,
  hashPasswordArgon2,
  verifyPasswordArgon2,
  generateClientCertificate,
  generateWebAuthnOptions,
  generateWebAuthnAssertionOptions,
  SessionManager,
  sessionManager,
  generateCAPTCHA,
  verifyCAPTCHA,
  detectMaliciousEnvironment,
  getProgressiveDelay,
  calculateDistance
};
