/**
 * Fraud Detection and Threat Prevention for Amenires World Bank
 * Real-time risk engines, velocity checks, bot detection, malware detection
 */

const crypto = require('crypto');
const UAParser = require('ua-parser-js');
const { RateLimiterMemory, RateLimiterRedis } = require('rate-limiter-flexible');

/**
 * Fraud Detection Configuration
 */
const FraudConfig = {
  MAX_LOGIN_ATTEMPTS_PER_IP: 5,
  MAX_LOGIN_ATTEMPTS_PER_ACCOUNT: 3,
  MAX_LOGIN_ATTEMPTS_PER_DEVICE: 3,
  TIME_WINDOW_MS: 15 * 60 * 1000, // 15 minutes

  VELOCITY_LIMITS: {
    transactions: 10, // per hour
    passwordResets: 3, // per day
    emailChanges: 1, // per day
    apiCalls: 100, // per minute
    loginAttempts: 5 // per minute
  },

  IMPOSSIBLE_TRAVEL_THRESHOLD_KMH: 800, // Speed threshold for impossible travel
  GEO_FENCING_RESTRICTIONS: [
    { country: 'KP', reason: 'Sanctions' },
    { country: 'IR', reason: 'Sanctions' },
    { country: 'CU', reason: 'Sanctions' }
  ],

  KNOWN_BOT_USER_AGENTS: [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
    'python-requests', 'httpie', 'postman', 'insomnia'
  ],

  MALICIOUS_IP_RANGES: [
    '192.0.2.0/24', // Documentation
    '203.0.113.0/24' // Documentation
  ]
};

/**
 * Rate Limiter Instances
 */
const rateLimiters = {
  loginByIP: new RateLimiterMemory({
    points: FraudConfig.MAX_LOGIN_ATTEMPTS_PER_IP,
    duration: FraudConfig.TIME_WINDOW_MS
  }),
  loginByAccount: new RateLimiterMemory({
    points: FraudConfig.MAX_LOGIN_ATTEMPTS_PER_ACCOUNT,
    duration: FraudConfig.TIME_WINDOW_MS
  }),
  loginByDevice: new RateLimiterMemory({
    points: FraudConfig.MAX_LOGIN_ATTEMPTS_PER_DEVICE,
    duration: FraudConfig.TIME_WINDOW_MS
  }),
  transactions: new RateLimiterMemory({
    points: FraudConfig.VELOCITY_LIMITS.transactions,
    duration: 60 * 60 * 1000 // 1 hour
  }),
  passwordResets: new RateLimiterMemory({
    points: FraudConfig.VELOCITY_LIMITS.passwordResets,
    duration: 24 * 60 * 60 * 1000 // 1 day
  }),
  emailChanges: new RateLimiterMemory({
    points: FraudConfig.VELOCITY_LIMITS.emailChanges,
    duration: 24 * 60 * 60 * 1000 // 1 day
  }),
  apiCalls: new RateLimiterMemory({
    points: FraudConfig.VELOCITY_LIMITS.apiCalls,
    duration: 60 * 1000 // 1 minute
  })
};

/**
 * Track login attempts
 */
class LoginAttemptTracker {
  constructor() {
    this.attempts = new Map();
  }

  /**
   * Record login attempt
   */
  recordAttempt(attempt) {
    const key = this._generateKey(attempt);
    const now = Date.now();

    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }

    const attempts = this.attempts.get(key);
    attempts.push({
      timestamp: now,
      success: attempt.success,
      ip: attempt.ip,
      userAgent: attempt.userAgent,
      userId: attempt.userId,
      deviceFingerprint: attempt.deviceFingerprint
    });

    // Clean old attempts
    this._cleanOldAttempts(key);

    return attempts;
  }

  /**
   * Get attempts for a key
   */
  getAttempts(ip, userId = null, deviceFingerprint = null) {
    const key = this._generateKey({ ip, userId, deviceFingerprint });
    return this.attempts.get(key) || [];
  }

  /**
   * Check if should block
   */
  shouldBlock(ip, userId = null, deviceFingerprint = null) {
    const attempts = this.getAttempts(ip, userId, deviceFingerprint);
    const recentAttempts = attempts.filter(
      a => Date.now() - a.timestamp < FraudConfig.TIME_WINDOW_MS
    );

    // Count failed attempts
    const failedAttempts = recentAttempts.filter(a => !a.success).length;

    return failedAttempts >= 5;
  }

  /**
   * Get statistics
   */
  getStatistics(ip, userId = null, deviceFingerprint = null) {
    const attempts = this.getAttempts(ip, userId, deviceFingerprint);
    const now = Date.now();

    return {
      totalAttempts: attempts.length,
      successfulAttempts: attempts.filter(a => a.success).length,
      failedAttempts: attempts.filter(a => !a.success).length,
      recentFailedAttempts: attempts.filter(
        a => !a.success && now - a.timestamp < FraudConfig.TIME_WINDOW_MS
      ).length,
      firstAttempt: attempts.length > 0 ? new Date(attempts[0].timestamp).toISOString() : null,
      lastAttempt: attempts.length > 0 ? new Date(attempts[attempts.length - 1].timestamp).toISOString() : null
    };
  }

  _generateKey(attempt) {
    const parts = [`ip:${attempt.ip}`];
    if (attempt.userId) parts.push(`user:${attempt.userId}`);
    if (attempt.deviceFingerprint) parts.push(`device:${attempt.deviceFingerprint}`);
    return parts.join('|');
  }

  _cleanOldAttempts(key) {
    const attempts = this.attempts.get(key);
    if (!attempts) return;

    const now = Date.now();
    const recentAttempts = attempts.filter(
      a => now - a.timestamp < 24 * 60 * 60 * 1000 // Keep for 24 hours
    );

    this.attempts.set(key, recentAttempts);
  }
}

const loginAttemptTracker = new LoginAttemptTracker();

/**
 * Check velocity limits
 */
const checkVelocityLimit = async (type, key) => {
  const limiter = rateLimiters[type];
  if (!limiter) {
    return { allowed: true, remainingPoints: Infinity };
  }

  try {
    const result = await limiter.consume(key);
    return {
      allowed: true,
      remainingPoints: result.remainingPoints
    };
  } catch (rej) {
    return {
      allowed: false,
      remainingPoints: rej.remainingPoints,
      retryAfter: rej.msBeforeNext
    };
  }
};

/**
 * Detect bot activity
 */
const detectBot = (req) => {
  const threats = [];
  let botScore = 0;

  // User-agent analysis
  const ua = req.get('user-agent') || '';
  const parser = new UAParser(ua);
  const userAgentInfo = parser.getResult();

  // Check for known bot strings
  const lowerUA = ua.toLowerCase();
  if (FraudConfig.KNOWN_BOT_USER_AGENTS.some(bot => lowerUA.includes(bot))) {
    threats.push({ type: 'known_bot_user_agent', ua });
    botScore += 80;
  }

  // Check for missing or malformed user-agent
  if (!ua || ua.length < 20) {
    threats.push({ type: 'missing_user_agent', ua });
    botScore += 40;
  }

  // Check for automated tools
  if (ua.includes('curl') || ua.includes('wget') || ua.includes('python')) {
    threats.push({ type: 'automated_tool', ua });
    botScore += 60;
  }

  // Check header patterns
  const headers = req.headers;
  const suspiciousHeaders = [];

  if (!headers['accept']) suspiciousHeaders.push('missing_accept');
  if (!headers['accept-language']) suspiciousHeaders.push('missing_accept_language');
  if (headers['accept-encoding'] && !headers['accept-encoding'].includes('gzip')) {
    suspiciousHeaders.push('invalid_accept_encoding');
  }

  if (suspiciousHeaders.length > 0) {
    threats.push({ type: 'suspicious_headers', headers: suspiciousHeaders });
    botScore += suspiciousHeaders.length * 20;
  }

  // Check request timing
  const startTime = parseInt(req.get('x-request-start') || '0');
  if (startTime > 0) {
    const requestDuration = Date.now() - startTime;
    if (requestDuration < 50) {
      threats.push({ type: 'too_fast', duration: requestDuration });
      botScore += 30;
    }
  }

  // Check for repetitive patterns
  const ip = req.ip;
  const ipStats = loginAttemptTracker.getStatistics(ip);
  if (ipStats.totalAttempts > 10 && ipStats.failedAttempts / ipStats.totalAttempts > 0.8) {
    threats.push({ type: 'high_failure_rate', ...ipStats });
    botScore += 50;
  }

  return {
    isBot: botScore >= 50,
    botScore: Math.min(botScore, 100),
    threats,
    userAgentInfo
  };
};

/**
 * Detect impossible travel
 */
const detectImpossibleTravel = (userId, currentLocation, previousLogin) => {
  if (!previousLogin || !currentLocation) {
    return { impossible: false };
  }

  const timeDiff = (Date.now() - previousLogin.timestamp) / 1000; // seconds
  const distance = calculateHaversineDistance(
    previousLogin.location.lat,
    previousLogin.location.lng,
    currentLocation.lat,
    currentLocation.lng
  );

  // Speed in km/h
  const speed = (distance / timeDiff) * 3600;

  const impossible = speed > FraudConfig.IMPOSSIBLE_TRAVEL_THRESHOLD_KMH;

  return {
    impossible,
    speed,
    speedThreshold: FraudConfig.IMPOSSIBLE_TRAVEL_THRESHOLD_KMH,
    distance,
    timeDiff,
    previousLocation: previousLogin.location,
    currentLocation
  };
};

/**
 * Calculate Haversine distance
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
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
 * Check geo-fencing restrictions
 */
const checkGeoFencing = (location) => {
  const violations = [];

  if (!location || !location.country) {
    return { allowed: true, violations: [] };
  }

  for (const restriction of FraudConfig.GEO_FENCING_RESTRICTIONS) {
    if (location.country === restriction.country) {
      violations.push({
        type: 'sanctioned_location',
        country: restriction.country,
        reason: restriction.reason
      });
    }
  }

  return {
    allowed: violations.length === 0,
    violations
  };
};

/**
 * Detect credential stuffing
 */
const detectCredentialStuffing = (email, password) => {
  // In production, this would check against breached credential databases
  // Common patterns to check

  const patterns = [
    { regex: /test.*test/, weight: 0.8 },
    { regex: /demo.*demo/, weight: 0.9 },
    { regex: /\d{6,}/, weight: 0.5 },
    { regex: /^(password|admin|123456|qwerty)$/i, weight: 1.0 }
  ];

  let score = 0;

  for (const pattern of patterns) {
    if (pattern.regex.test(password.toLowerCase())) {
      score += pattern.weight;
    }
  }

  // Check email+password combinations from known breaches
  const breachedCombinations = [
    'admin@amenires.com:admin123',
    'test@test.com:test1234'
  ];

  const combination = `${email.toLowerCase()}:${password.toLowerCase()}`;
  if (breachedCombinations.includes(combination)) {
    score += 1.0;
  }

  return {
    isCredentialStuffing: score >= 1.0,
    score: Math.min(score, 1.0),
    confidence: score >= 0.8 ? 'high' : score >= 0.5 ? 'medium' : 'low'
  };
};

/**
 * Detect malware/environment threats
 */
const detectMalware = (req) => {
  const threats = [];

  // Check for Remote Access Trojans (RATs)
  const ua = req.get('user-agent') || '';
  const ratIndicators = [
    'TeamViewer',
    'AnyDesk',
    'Chrome Remote Desktop',
    'RustDesk',
    'UltraVNC'
  ];

  for (const indicator of ratIndicators) {
    if (ua.includes(indicator)) {
      threats.push({
        type: 'remote_access_software',
        software: indicator,
        severity: 'high'
      });
    }
  }

  // Check for virtual machines
  const vmIndicators = [
    'VirtualBox',
    'VMware',
    'QEMU',
    'Xen',
    'Hyper-V'
  ];

  for (const indicator of vmIndicators) {
    if (ua.includes(indicator)) {
      threats.push({
        type: 'virtual_machine',
        software: indicator,
        severity: 'medium'
      });
    }
  }

  // Check for Tor exit nodes
  const ip = req.ip;
  const torExitNodes = [
    '185.220.101.0/24',
    '185.220.102.0/24',
    '185.220.103.0/24'
  ];

  for (const torRange of torExitNodes) {
    if (isIPInRange(ip, torRange)) {
      threats.push({
        type: 'tor_exit_node',
        ip,
        severity: 'high'
      });
    }
  }

  // Check for known malicious IPs
  for (const malicousRange of FraudConfig.MALICIOUS_IP_RANGES) {
    if (isIPInRange(ip, malicousRange)) {
      threats.push({
        type: 'malicious_ip',
        ip,
        severity: 'critical'
      });
    }
  }

  // Check for proxy/VPN indicators
  const proxyHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'via',
    'x-cache-client-ip'
  ];

  let proxyCount = 0;
  for (const header of proxyHeaders) {
    if (req.get(header)) {
      proxyCount++;
    }
  }

  if (proxyCount >= 2) {
    threats.push({
      type: 'proxy_detected',
      severity: 'medium'
    });
  }

  return {
    hasThreats: threats.length > 0,
    threats,
    riskLevel: threats.length === 0 ? 'low' :
               threats.some(t => t.severity === 'critical') ? 'critical' :
               threats.some(t => t.severity === 'high') ? 'high' : 'medium'
  };
};

/**
 * Check if IP is in CIDR range
 */
function isIPInRange(ip, cidr) {
  const [range, bits] = cidr.split('/');
  const mask = parseInt(bits, 10);

  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);
  const maskNum = ~((1 << (32 - mask)) - 1);

  return (ipNum & maskNum) === (rangeNum & maskNum);
}

function ipToNumber(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

/**
 * Generate device reputation score
 */
const calculateDeviceReputation = (deviceProfile, historicalData) => {
  let reputationScore = 100; // Start with perfect score

  // New device penalty
  if (!historicalData || historicalData.loginCount === 0) {
    reputationScore -= 30;
  }

  // Device age
  if (historicalData) {
    const deviceAge = Date.now() - historicalData.firstSeen;
    if (deviceAge < 24 * 60 * 60 * 1000) { // Less than 1 day
      reputationScore -= 20;
    } else if (deviceAge < 7 * 24 * 60 * 60 * 1000) { // Less than 1 week
      reputationScore -= 10;
    }
  }

  // Failed login ratio
  if (historicalData) {
    const failureRatio = historicalData.failedLogins / historicalData.totalLogins;
    if (failureRatio > 0.5) {
      reputationScore -= 40;
    } else if (failureRatio > 0.3) {
      reputationScore -= 20;
    }
  }

  // Platform trust
  const trustedPlatforms = ['Windows', 'MacOS', 'iOS', 'Android'];
  if (!trustedPlatforms.includes(deviceProfile.platform)) {
    reputationScore -= 15;
  }

  // Browser trust
  const trustedBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  if (!trustedBrowsers.includes(deviceProfile.browser)) {
    reputationScore -= 15;
  }

  return {
    score: Math.max(0, Math.min(100, reputationScore)),
    level: reputationScore >= 80 ? 'trusted' :
           reputationScore >= 50 ? 'unknown' :
           reputationScore >= 30 ? 'suspicious' : 'malicious'
  };
};

/**
 * Generate comprehensive fraud report
 */
const generateFraudReport = (req, userId = null) => {
  const botDetection = detectBot(req);
  const malwareDetection = detectMalware(req);
  const credentialStuffing = req.body.password ?
    detectCredentialStuffing(req.body.email, req.body.password) :
    { isCredentialStuffing: false };

  return {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userId,
    botDetection,
    malwareDetection,
    credentialStuffing,
    overallRiskScore: calculateOverallRiskScore(botDetection, malwareDetection, credentialStuffing),
    recommendedAction: determineRecommendedAction(botDetection, malwareDetection, credentialStuffing)
  };
};

/**
 * Calculate overall risk score
 */
function calculateOverallRiskScore(botDetection, malwareDetection, credentialStuffing) {
  let score = 0;

  if (botDetection.isBot) {
    score += botDetection.botScore;
  }

  if (malwareDetection.hasThreats) {
    const severityWeight = {
      low: 10,
      medium: 30,
      high: 60,
      critical: 100
    };
    for (const threat of malwareDetection.threats) {
      score += severityWeight[threat.severity] || 10;
    }
  }

  if (credentialStuffing.isCredentialStuffing) {
    score += 70;
  }

  return Math.min(100, score);
}

/**
 * Determine recommended action
 */
function determineRecommendedAction(botDetection, malwareDetection, credentialStuffing) {
  if (malwareDetection.riskLevel === 'critical') {
    return 'block';
  }
  if (botDetection.botScore >= 80) {
    return 'captcha';
  }
  if (credentialStuffing.isCredentialStuffing) {
    return 'mfa_required';
  }
  if (malwareDetection.hasThreats || botDetection.isBot) {
    return 'enhanced_monitoring';
  }
  return 'allow';
}

module.exports = {
  FraudConfig,
  rateLimiters,
  LoginAttemptTracker,
  loginAttemptTracker,
  checkVelocityLimit,
  detectBot,
  detectImpossibleTravel,
  detectCredentialStuffing,
  detectMalware,
  calculateDeviceReputation,
  generateFraudReport,
  checkGeoFencing
};
