/**
 * Comprehensive MFA Implementation for Amenires World Bank
 * Supports: Knowledge, Possession, Inherence, Location, Contextual Factors
 */

const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * MFA Factor Types
 */
const MFAFactors = {
  KNOWLEDGE: {
    password: 'password',
    pin: 'pin',
    securityQuestion: 'securityQuestion',
    transactionCode: 'transactionCode',
    patternLock: 'patternLock',
    graphicalPassword: 'graphicalPassword'
  },
  POSSESSION: {
    hardwareToken: 'hardwareToken',
    mobileOTP: 'mobileOTP',
    pushNotification: 'pushNotification',
    totp: 'totp',
    softToken: 'softToken',
    physicalMail: 'physicalMail'
  },
  INHERENCE: {
    fingerprint: 'fingerprint',
    facialRecognition: 'facialRecognition',
    iris: 'iris',
    voice: 'voice',
    palmVein: 'palmVein',
    behavioral: 'behavioral',
    gait: 'gait'
  },
  LOCATION: {
    ipGeolocation: 'ipGeolocation',
    gps: 'gps',
    wifiFingerprint: 'wifiFingerprint',
    cellTower: 'cellTower',
    geoFencing: 'geoFencing'
  },
  CONTEXTUAL: {
    deviceFingerprint: 'deviceFingerprint',
    deviceRegistration: 'deviceRegistration',
    trustedDevice: 'trustedDevice',
    riskBasedAuth: 'riskBasedAuth'
  }
};

/**
 * Generate TOTP Secret
 */
const generateTOTPSecret = (userEmail) => {
  return speakeasy.generateSecret({
    name: `Amenires World Bank (${userEmail})`,
    issuer: 'Amenires World Bank',
    length: 32
  });
};

/**
 * Generate QR Code for TOTP
 */
const generateTOTPQRCode = async (secret) => {
  try {
    return await QRCode.toDataURL(secret.otpauth_url);
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Verify TOTP Code
 */
const verifyTOTP = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
    time: 30
  });
};

/**
 * Generate Backup Codes
 */
const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.substring(0, 4)}-${code.substring(4, 8)}`);
  }
  return codes;
};

/**
 * Generate SMS OTP
 */
const generateSMSOTP = (length = 6) => {
  return crypto.randomBytes(length / 2).toString('hex').substring(0, length);
};

/**
 * Generate PIN
 */
const generatePIN = (length = 6) => {
  const digits = '0123456789';
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += digits[crypto.randomInt(0, digits.length)];
  }
  return pin;
};

/**
 * Generate Transaction Signing Code
 */
const generateTransactionCode = (amount, payee, timestamp) => {
  const combined = `${amount}|${payee}|${timestamp}`;
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  return hash.substring(0, 6).toUpperCase();
};

/**
 * Generate Pattern Lock Grid
 */
const generatePatternLockGrid = (size = 3) => {
  return {
    size,
    points: Array.from({ length: size * size }, (_, i) => ({
      id: i + 1,
      x: (i % size) + 1,
      y: Math.floor(i / size) + 1
    }))
  };
};

/**
 * Validate Pattern Lock
 */
const validatePatternLock = (pattern, savedPattern) => {
  const patternStr = pattern.sort((a, b) => a - b).join('-');
  const savedStr = savedPattern.sort((a, b) => a - b).join('-');
  return patternStr === savedStr;
};

/**
 * Generate Security Questions
 */
const generateSecurityQuestions = (customQuestions = null) => {
  const defaultQuestions = [
    "What was the name of your first pet?",
    "What is your mother's maiden name?",
    "What city were you born in?",
    "What was the make and model of your first car?",
    "What is the name of your favorite teacher?",
    "What is your oldest sibling's middle name?",
    "In what city or town did your parents meet?"
  ];

  if (customQuestions && customQuestions.length >= 3) {
    return customQuestions;
  }

  // Randomly select 3 questions
  const selected = [];
  const available = [...defaultQuestions];
  for (let i = 0; i < 3; i++) {
    const index = crypto.randomInt(0, available.length);
    selected.push(available.splice(index, 1)[0]);
  }
  return selected;
};

/**
 * Hash Biometric Template
 */
const hashBiometricTemplate = (template) => {
  return crypto.createHash('sha512').update(template).digest('hex');
};

/**
 * Generate Biometric Challenge
 */
const generateBiometricChallenge = () => {
  return {
    challenge: crypto.randomBytes(32).toString('base64'),
    timestamp: Date.now(),
    expiresAt: Date.now() + 300000 // 5 minutes
  };
};

/**
 * Verify Biometric Response
 */
const verifyBiometricResponse = (challenge, response, storedTemplate) => {
  // In production, use sophisticated biometric matching algorithms
  const responseHash = hashBiometricTemplate(response);
  const templateHash = hashBiometricTemplate(storedTemplate);
  return responseHash === templateHash;
};

/**
 * Capture Behavioral Biometrics
 */
const captureBehavioralBiometrics = (keystrokes, mouseMovements, touchData) => {
  return {
    keystrokeDynamics: {
      typingSpeed: calculateTypingSpeed(keystrokes),
      dwellTime: calculateDwellTime(keystrokes),
      flightTime: calculateFlightTime(keystrokes),
      keyHoldVariance: calculateKeyHoldVariance(keystrokes)
    },
    mousePatterns: {
      movementPaths: mouseMovements,
      velocity: calculateMouseVelocity(mouseMovements),
      acceleration: calculateMouseAcceleration(mouseMovements),
      clickPatterns: analyzeClickPatterns(mouseMovements)
    },
    touchMetrics: touchData ? {
      pressure: touchData.pressure,
      swipeVelocity: touchData.swipeVelocity,
      tilt: touchData.tilt,
      multitouchPatterns: touchData.multitouchPatterns
    } : null,
    timestamp: Date.now()
  };
};

/**
 * Calculate Typing Speed
 */
const calculateTypingSpeed = (keystrokes) => {
  if (!keystrokes || keystrokes.length < 2) return 0;
  const totalTime = keystrokes[keystrokes.length - 1].timestamp - keystrokes[0].timestamp;
  return (keystrokes.length / totalTime) * 1000; // characters per second
};

/**
 * Calculate Dwell Time (key press duration)
 */
const calculateDwellTime = (keystrokes) => {
  if (!keystrokes) return [];
  return keystrokes.map(k => k.releaseTime - k.timestamp);
};

/**
 * Calculate Flight Time (time between keys)
 */
const calculateFlightTime = (keystrokes) => {
  if (!keystrokes || keystrokes.length < 2) return [];
  const flights = [];
  for (let i = 1; i < keystrokes.length; i++) {
    flights.push(keystrokes[i].timestamp - keystrokes[i - 1].releaseTime);
  }
  return flights;
};

/**
 * Calculate Key Hold Variance
 */
const calculateKeyHoldVariance = (keystrokes) => {
  const dwellTimes = calculateDwellTime(keystrokes);
  if (dwellTimes.length === 0) return 0;
  const mean = dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length;
  const variance = dwellTimes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dwellTimes.length;
  return variance;
};

/**
 * Calculate Mouse Velocity
 */
const calculateMouseVelocity = (movements) => {
  if (!movements || movements.length < 2) return 0;
  let totalVelocity = 0;
  for (let i = 1; i < movements.length; i++) {
    const dx = movements[i].x - movements[i - 1].x;
    const dy = movements[i].y - movements[i - 1].y;
    const dt = movements[i].timestamp - movements[i - 1].timestamp;
    const distance = Math.sqrt(dx * dx + dy * dy);
    totalVelocity += distance / dt;
  }
  return totalVelocity / (movements.length - 1);
};

/**
 * Calculate Mouse Acceleration
 */
const calculateMouseAcceleration = (movements) => {
  if (!movements || movements.length < 3) return 0;
  let totalAcceleration = 0;
  for (let i = 2; i < movements.length; i++) {
    const v1 = calculateMouseVelocity([movements[i - 2], movements[i - 1]]);
    const v2 = calculateMouseVelocity([movements[i - 1], movements[i]]);
    const dt = movements[i].timestamp - movements[i - 1].timestamp;
    totalAcceleration += (v2 - v1) / dt;
  }
  return totalAcceleration / (movements.length - 2);
};

/**
 * Analyze Click Patterns
 */
const analyzeClickPatterns = (movements) => {
  const clicks = movements.filter(m => m.type === 'click');
  return {
    count: clicks.length,
    intervals: clicks.map((c, i) => i > 0 ? c.timestamp - clicks[i - 1].timestamp : 0),
    precision: clicks.map(c => ({
      x: c.x,
      y: c.y,
      jitter: c.jitter || 0
    }))
  };
};

/**
 * Generate Device Fingerprint
 */
const generateDeviceFingerprint = (req) => {
  const ua = req.get('user-agent') || '';
  const accept = req.get('accept') || '';
  const acceptLanguage = req.get('accept-language') || '';
  const acceptEncoding = req.get('accept-encoding') || '';
  const connection = req.get('connection') || '';

  const fingerprint = {
    userAgent: ua,
    accept,
    acceptLanguage,
    acceptEncoding,
    connection,
    ip: req.ip,
    timestamp: Date.now()
  };

  // Generate hash
  const fingerprintStr = JSON.stringify(fingerprint);
  const hash = crypto.createHash('sha256').update(fingerprintStr).digest('hex');

  return {
    hash,
    data: fingerprint
  };
};

/**
 * Generate Advanced Canvas Fingerprint
 */
const generateCanvasFingerprint = () => {
  // In browser, this would create a canvas and draw text/shapes
  // For server-side, we simulate the hash generation
  const canvasData = {
    font: 'Arial',
    text: 'Amenires World Bank Fingerprint',
    shapes: ['rect', 'circle', 'triangle'],
    colors: ['#000000', '#FF0000', '#00FF00']
  };
  const canvasStr = JSON.stringify(canvasData);
  return crypto.createHash('sha256').update(canvasStr).digest('hex');
};

/**
 * Generate WebGL Fingerprint
 */
const generateWebGLFingerprint = () => {
  // Simulated WebGL fingerprint parameters
  const webglData = {
    renderer: 'ANGLE (NVIDIA)',
    vendor: 'NVIDIA Corporation',
    version: 'WebGL 2.0',
    shadingLanguageVersion: 'WebGL GLSL ES 3.00',
    extensions: ['EXT_color_buffer_float', 'OES_texture_float_linear'],
    maxTextureSize: 16384,
    maxRenderbufferSize: 16384
  };
  const webglStr = JSON.stringify(webglData);
  return crypto.createHash('sha256').update(webglStr).digest('hex');
};

/**
 * Generate Complete Device Profile
 */
const generateDeviceProfile = (req) => {
  return {
    deviceFingerprint: generateDeviceFingerprint(req),
    canvasFingerprint: generateCanvasFingerprint(),
    webglFingerprint: generateWebGLFingerprint(),
    screenResolution: req.body.screenResolution || 'unknown',
    colorDepth: req.body.colorDepth || 24,
    timezone: req.body.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: req.get('accept-language') || 'en-US',
    platform: req.body.platform || 'unknown',
    cores: req.body.cores || 4,
    memory: req.body.memory || 8,
    touchSupport: req.body.touchSupport || false,
    firstSeen: Date.now(),
    lastSeen: Date.now()
  };
};

/**
 * Verify Location
 */
const verifyLocation = (req, allowedLocations) => {
  const clientIP = req.ip;
  const clientLocation = {
    ip: clientIP,
    country: req.body.country || 'unknown',
    city: req.body.city || 'unknown',
    gps: req.body.gps || null
  };

  // Check if location is in allowed list
  if (allowedLocations && allowedLocations.length > 0) {
    const isAllowed = allowedLocations.some(loc => {
      if (loc.type === 'country') {
        return clientLocation.country === loc.value;
      } else if (loc.type === 'gps') {
        if (!clientLocation.gps) return false;
        const distance = calculateGPSDistance(
          clientLocation.gps.lat,
          clientLocation.gps.lng,
          loc.value.lat,
          loc.value.lng
        );
        return distance <= loc.radius;
      }
      return false;
    });

    return {
      verified: isAllowed,
      location: clientLocation,
      reason: isAllowed ? 'Location allowed' : 'Location not in allowed list'
    };
  }

  return {
    verified: true,
    location: clientLocation,
    reason: 'No location restrictions'
  };
};

/**
 * Calculate GPS Distance (Haversine formula)
 */
const calculateGPSDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Risk-Based Authentication Score
 */
const calculateRiskScore = (factors) => {
  let riskScore = 0; // 0 = low risk, 100 = high risk

  // Factor weights
  const weights = {
    deviceReputation: 25,
    location: 20,
    behavioralBiometrics: 20,
    timeOfDay: 10,
    loginAttempts: 15,
    velocity: 10
  };

  // Device reputation
  if (factors.deviceReputation === 'known_malicious') {
    riskScore += weights.deviceReputation;
  } else if (factors.deviceReputation === 'suspicious') {
    riskScore += weights.deviceReputation * 0.7;
  } else if (factors.deviceReputation === 'unknown') {
    riskScore += weights.deviceReputation * 0.3;
  }

  // Location anomalies
  if (factors.locationAnomaly === 'impossible_travel') {
    riskScore += weights.location;
  } else if (factors.locationAnomaly === 'new_location') {
    riskScore += weights.location * 0.5;
  }

  // Behavioral biometrics
  if (factors.behavioralMatch === 'low') {
    riskScore += weights.behavioralBiometrics;
  } else if (factors.behavioralMatch === 'medium') {
    riskScore += weights.behavioralBiometrics * 0.5;
  }

  // Time of day (unusual hours)
  if (factors.unusualTime) {
    riskScore += weights.timeOfDay;
  }

  // Login attempts
  riskScore += Math.min(factors.failedLoginAttempts * 5, weights.loginAttempts);

  // Velocity (too many attempts)
  if (factors.highVelocity) {
    riskScore += weights.velocity;
  }

  return Math.min(riskScore, 100);
};

/**
 * Determine Authentication Level Based on Risk
 */
const determineAuthLevel = (riskScore) => {
  if (riskScore < 20) {
    return { level: 'minimal', factorsRequired: 1 };
  } else if (riskScore < 40) {
    return { level: 'standard', factorsRequired: 2 };
  } else if (riskScore < 60) {
    return { level: 'enhanced', factorsRequired: 3 };
  } else if (riskScore < 80) {
    return { level: 'high', factorsRequired: 4 };
  } else {
    return { level: 'critical', factorsRequired: 5, action: 'block' };
  }
};

module.exports = {
  MFAFactors,
  generateTOTPSecret,
  generateTOTPQRCode,
  verifyTOTP,
  generateBackupCodes,
  generateSMSOTP,
  generatePIN,
  generateTransactionCode,
  generatePatternLockGrid,
  validatePatternLock,
  generateSecurityQuestions,
  hashBiometricTemplate,
  generateBiometricChallenge,
  verifyBiometricResponse,
  captureBehavioralBiometrics,
  generateDeviceFingerprint,
  generateCanvasFingerprint,
  generateWebGLFingerprint,
  generateDeviceProfile,
  verifyLocation,
  calculateGPSDistance,
  calculateRiskScore,
  determineAuthLevel
};
