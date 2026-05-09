/**
 * Infrastructure Hardening for Amenires World Bank
 * WAF, rate limiting, CSP, API security, TLS configuration, DNS security
 */

const helmet = require('helmet');
const expressRateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const crypto = require('crypto');
const { expressCspHeader, INLINE, NONE, SELF } = require('express-csp-header');

/**
 * Security Headers Configuration
 */
const SecurityHeadersConfig = {
  // Content Security Policy
  CSP: {
    directives: {
      defaultSrc: [SELF],
      scriptSrc: [
        SELF,
        INLINE,
        "'unsafe-eval'",
        "https://cdn.amenires.worldbank.com",
        "https://cdnjs.cloudflare.com",
        "https://apis.google.com",
        "https://connect.facebook.net",
        "https://res.wx.qq.com"
      ],
      styleSrc: [
        SELF,
        INLINE,
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.amenires.worldbank.com"
      ],
      imgSrc: [
        SELF,
        "data:",
        "https:",
        "blob:"
      ],
      fontSrc: [
        SELF,
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.amenires.worldbank.com"
      ],
      connectSrc: [
        SELF,
        "https://api.amenires.worldbank.com",
        "wss://ws.amenires.worldbank.com",
        "https://accounts.google.com",
        "https://graph.facebook.com"
      ],
      mediaSrc: [SELF, "https://cdn.amenires.worldbank.com"],
      objectSrc: [NONE],
      baseUri: [SELF],
      formAction: [SELF],
      frameAncestors: [NONE],
      frameSrc: [SELF, "https://accounts.google.com", "https://staticxx.facebook.com"],
      workerSrc: [SELF],
      manifestSrc: [SELF],
      reportUri: '/api/security/csp-report'
    }
  },

  // HSTS
  HSTS: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // Other headers
  X_FRAME_OPTIONS: 'DENY',
  X_CONTENT_TYPE_OPTIONS: 'nosniff',
  X_DNS_PREFETCH_CONTROL: 'off',
  X_DOWNLOAD_OPTIONS: 'noopen',
  X_XSS_PROTECTION: '1; mode=block',
  REFERRER_POLICY: 'strict-origin-when-cross-origin',
  PERMISSIONS_POLICY: {
    features: {
      geolocation: [SELF],
      camera: [SELF],
      microphone: [SELF],
      payment: [SELF],
      usb: [NONE],
      magnetometer: [NONE]
    }
  }
};

/**
 * Web Application Firewall Rules
 */
const WAFRules = {
  SQL_INJECTION_PATTERNS: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|EXECUTE)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\-\-|\#|\/\*|\*\/)/,
    /(\b(0x[0-9a-f]+)\b)/i
  ],

  XSS_PATTERNS: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi
  ],

  PATH_TRAVERSAL_PATTERNS: [
    /\.\.[\/\\]/,
    /%2e%2e[\/\\]/i,
    /%252e%252e[\/\\]/i,
    /[\/\\]\.\.[\/\\]/
  ],

  COMMAND_INJECTION_PATTERNS: [
    /[;&|`$()]/,
    /\beval\s*\(/i,
    /\bexec\s*\(/i,
    /\bsystem\s*\(/i
  ],

  SSRF_PATTERNS: [
    /http[s]?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/i,
    /file:\/\/\/|gopher:\/\/|dict:\/\//i
  ],

  MALICIOUS_USER_AGENTS: [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /metasploit/i,
    /nmap/i,
    /burp/i,
    /zap/i,
    /acunetix/i,
    /w3af/i,
    /hydra/i
  ],

  REQUEST_SIZE_LIMITS: {
    default: '1mb',
    upload: '50mb',
    login: '10kb'
  }
};

/**
 * Rate Limiting Configuration
 */
const RateLimitingConfig = {
  // Global limits
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    message: 'Too many requests from this IP, please try again later.'
  },

  // API limits
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
    message: 'API rate limit exceeded'
  },

  // Authentication limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    skipSuccessfulRequests: true,
    message: 'Too many authentication attempts, please try again later.'
  },

  // Login limits
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    skipSuccessfulRequests: true,
    message: 'Too many login attempts. Account temporarily locked.'
  },

  // Password reset limits
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many password reset attempts. Please try again later.'
  },

  // Transaction limits
  transaction: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Transaction rate limit exceeded'
  },

  // Sensitive operations
  sensitive: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3,
    message: 'Sensitive operation rate limit exceeded'
  }
};

/**
 * Slow Down Configuration (Gradual throttling)
 */
const SlowDownConfig = {
  api: {
    windowMs: 60 * 1000, // 1 minute
    delayAfter: 50, // Start slowing after 50 requests
    delayMs: (hits) => (hits - 50) * 500 // Add 500ms delay per hit after threshold
  },
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 3, // Start slowing after 3 attempts
    delayMs: (hits) => (hits - 3) * 1000 // Add 1s delay per hit after threshold
  }
};

/**
 * IP Whitelist/Blacklist Management
 */
class IPFilterManager {
  constructor() {
    this.whitelist = new Set();
    this.blacklist = new Set();
    this.geoRestrictions = new Map();
  }

  addToWhitelist(ip) { this.whitelist.add(ip); }
  addToBlacklist(ip) { this.blacklist.add(ip); }
  removeFromWhitelist(ip) { this.whitelist.delete(ip); }
  removeFromBlacklist(ip) { this.blacklist.delete(ip); }

  isAllowed(ip) {
    if (this.blacklist.has(ip)) return { allowed: false, reason: 'blacklisted' };
    if (this.whitelist.size > 0 && !this.whitelist.has(ip)) return { allowed: false, reason: 'not_whitelisted' };
    return { allowed: true };
  }
}

const ipFilterManager = new IPFilterManager();

/**
 * Security Headers Middleware
 */
const securityHeaders = [
  expressCspHeader(SecurityHeadersConfig.CSP),
  (req, res, next) => {
    // HSTS
    if (SecurityHeadersConfig.HSTS.includeSubDomains) {
      res.setHeader(
        'Strict-Transport-Security',
        `max-age=${SecurityHeadersConfig.HSTS.maxAge}; includeSubDomains; preload`
      );
    }

    // Standard headers
    res.setHeader('X-Frame-Options', SecurityHeadersConfig.X_FRAME_OPTIONS);
    res.setHeader('X-Content-Type-Options', SecurityHeadersConfig.X_CONTENT_TYPE_OPTIONS);
    res.setHeader('X-DNS-Prefetch-Control', SecurityHeadersConfig.X_DNS_PREFETCH_CONTROL);
    res.setHeader('X-Download-Options', SecurityHeadersConfig.X_DOWNLOAD_OPTIONS);
    res.setHeader('X-XSS-Protection', SecurityHeadersConfig.X_XSS_PROTECTION);
    res.setHeader('Referrer-Policy', SecurityHeadersConfig.REFERRER_POLICY);

    // Permissions-Policy
    const permissionsPolicy = Object.entries(SecurityHeadersConfig.PERMISSIONS_POLICY.features)
      .map(([feature, allow]) => `${feature}=(${allow.join(' ')})`)
      .join(', ');
    res.setHeader('Permissions-Policy', permissionsPolicy);

    res.setHeader('X-Powered-By', '');
    res.setHeader('Server', 'AWB-Secure-AI-v90T');

    next();
  }
];

/**
 * WAF Middleware
 */
const wafMiddleware = (req, res, next) => {
  const violations = [];
  const combinedInput = `${JSON.stringify(req.body)} ${JSON.stringify(req.query)} ${JSON.stringify(req.params)}`;

  for (const pattern of WAFRules.SQL_INJECTION_PATTERNS) {
    if (pattern.test(combinedInput)) violations.push({ type: 'sql_injection', pattern: pattern.toString() });
  }

  for (const pattern of WAFRules.XSS_PATTERNS) {
    if (pattern.test(combinedInput)) violations.push({ type: 'xss', pattern: pattern.toString() });
  }

  for (const pattern of WAFRules.PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(req.path)) violations.push({ type: 'path_traversal', pattern: pattern.toString() });
  }

  for (const pattern of WAFRules.COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(combinedInput)) violations.push({ type: 'command_injection', pattern: pattern.toString() });
  }

  const ua = req.get('user-agent') || '';
  for (const pattern of WAFRules.MALICIOUS_USER_AGENTS) {
    if (pattern.test(ua)) violations.push({ type: 'malicious_user_agent', pattern: pattern.toString() });
  }

  if (violations.length > 0) {
    console.error('WAF Violation:', { ip: req.ip, violations, path: req.path });
    return res.status(403).json({ status: 'error', message: 'Blocked by Amenires AI Defense System', violations });
  }

  next();
};

/**
 * IP Filter Middleware
 */
const ipFilterMiddleware = (req, res, next) => {
  const ipCheck = ipFilterManager.isAllowed(req.ip);
  if (!ipCheck.allowed) return res.status(403).json({ status: 'error', message: 'Access denied', reason: ipCheck.reason });
  next();
};

/**
 * Request Size Limit Middleware
 */
const requestSizeLimit = (limit = '1mb') => (req, res, next) => {
  const contentLength = parseInt(req.get('content-length') || '0');
  if (contentLength > parseSize(limit)) return res.status(413).json({ status: 'error', message: 'Payload too large for Amenires Banking System' });
  next();
};

function parseSize(size) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toString().toLowerCase().match(/^(\d+)\s*([a-z]+)?$/);
  if (!match) return 0;
  return parseInt(match[1]) * (units[match[2] || 'b'] || 1);
}

const globalRateLimiter = expressRateLimit(RateLimitingConfig.global);
const apiRateLimiter = expressRateLimit(RateLimitingConfig.api);
const authRateLimiter = expressRateLimit(RateLimitingConfig.auth);
const loginRateLimiter = expressRateLimit(RateLimitingConfig.login);
const passwordResetRateLimiter = expressRateLimit(RateLimitingConfig.passwordReset);
const transactionRateLimiter = expressRateLimit(RateLimitingConfig.transaction);
const sensitiveRateLimiter = expressRateLimit(RateLimitingConfig.sensitive);

const apiSlowDown = slowDown(SlowDownConfig.api);
const loginSlowDown = slowDown(SlowDownConfig.login);

module.exports = {
  SecurityHeadersConfig,
  WAFRules,
  RateLimitingConfig,
  SlowDownConfig,
  IPFilterManager,
  ipFilterManager,
  securityHeaders,
  wafMiddleware,
  ipFilterMiddleware,
  requestSizeLimit,
  globalRateLimiter,
  apiRateLimiter,
  authRateLimiter,
  loginRateLimiter,
  passwordResetRateLimiter,
  transactionRateLimiter,
  sensitiveRateLimiter,
  apiSlowDown,
  loginSlowDown
};
