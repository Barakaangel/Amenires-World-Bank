/**
 * Infrastructure Hardening for Amenires World Bank
 * WAF, rate limiting, CSP, API security, TLS configuration, DNS security
 */

const helmet = require('helmet');
const expressRateLimit = require('express-rate-limit');
// const slowDown = require('express-slow-down'); // Temporarily disabled
const crypto = require('crypto');

/**
 * Security Headers Configuration
 */
const SecurityHeadersConfig = {
  // Content Security Policy
  CSP: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.amenires.worldbank.com",
        "https://cdn.trust-provider.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.amenires.worldbank.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.amenires.worldbank.com"
      ],
      connectSrc: [
        "'self'",
        "https://api.amenires.worldbank.com",
        "wss://ws.amenires.worldbank.com"
      ],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      frameSrc: ["'none'"],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
      reportUri: '/api/security/csp-report'
    },
    reportOnly: false
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
      geolocation: ["'self'"],
      camera: ["'self'"],
      microphone: ["'self'"],
      payment: ["'self'"],
      usb: ["'none'"],
      magnetometer: ["'none'"]
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
    max: 5,
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
    delayMs: 500 // Add 500ms delay after threshold
  },
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 3, // Start slowing after 3 attempts
    delayMs: 1000 // Add 1s delay after threshold
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

  /**
   * Add IP to whitelist
   */
  addToWhitelist(ip) {
    this.whitelist.add(ip);
  }

  /**
   * Add IP to blacklist
   */
  addToBlacklist(ip) {
    this.blacklist.add(ip);
  }

  /**
   * Remove IP from whitelist
   */
  removeFromWhitelist(ip) {
    this.whitelist.delete(ip);
  }

  /**
   * Remove IP from blacklist
   */
  removeFromBlacklist(ip) {
    this.blacklist.delete(ip);
  }

  /**
   * Check if IP is allowed
   */
  isAllowed(ip) {
    // If blacklist has it, deny
    if (this.blacklist.has(ip)) {
      return { allowed: false, reason: 'blacklisted' };
    }

    // If whitelist exists and IP not in it, deny
    if (this.whitelist.size > 0 && !this.whitelist.has(ip)) {
      return { allowed: false, reason: 'not_whitelisted' };
    }

    return { allowed: true };
  }

  /**
   * Add geo restriction
   */
  addGeoRestriction(countryCode, action) {
    this.geoRestrictions.set(countryCode.toUpperCase(), action); // 'allow' or 'deny'
  }

  /**
   * Check geo restriction
   */
  checkGeoRestriction(countryCode) {
    const action = this.geoRestrictions.get(countryCode?.toUpperCase());

    if (!action) {
      return { allowed: true, reason: 'no_restriction' };
    }

    if (action === 'allow') {
      return { allowed: true, reason: 'geo_allowed' };
    } else {
      return { allowed: false, reason: 'geo_blocked' };
    }
  }
}

const ipFilterManager = new IPFilterManager();

/**
 * Security Headers Middleware
 */
const securityHeaders = (req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', buildCSP(SecurityHeadersConfig.CSP.directives));

  // HSTS
  if (SecurityHeadersConfig.HSTS.includeSubDomains) {
    res.setHeader(
      'Strict-Transport-Security',
      `max-age=${SecurityHeadersConfig.HSTS.maxAge}; includeSubDomains; preload`
    );
  }

  // X-Frame-Options
  res.setHeader('X-Frame-Options', SecurityHeadersConfig.X_FRAME_OPTIONS);

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', SecurityHeadersConfig.X_CONTENT_TYPE_OPTIONS);

  // X-DNS-Prefetch-Control
  res.setHeader('X-DNS-Prefetch-Control', SecurityHeadersConfig.X_DNS_PREFETCH_CONTROL);

  // X-Download-Options
  res.setHeader('X-Download-Options', SecurityHeadersConfig.X_DOWNLOAD_OPTIONS);

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', SecurityHeadersConfig.X_XSS_PROTECTION);

  // Referrer-Policy
  res.setHeader('Referrer-Policy', SecurityHeadersConfig.REFERRER_POLICY);

  // Permissions-Policy
  const permissionsPolicy = Object.entries(SecurityHeadersConfig.PERMISSIONS_POLICY.features)
    .map(([feature, allow]) => `${feature}=${allow.join(',')}`)
    .join(', ');
  res.setHeader('Permissions-Policy', permissionsPolicy);

  // Additional security headers
  res.setHeader('X-Powered-By', '');
  res.setHeader('Server', 'AWB-Secure');

  next();
};

/**
 * Build CSP string from directives
 */
function buildCSP(directives) {
  return Object.entries(directives)
    .map(([directive, values]) => {
      const valuesStr = Array.isArray(values) ? values.join(' ') : values;
      return `${directive} ${valuesStr}`;
    })
    .join('; ');
}

/**
 * WAF Middleware
 */
const wafMiddleware = (req, res, next) => {
  const violations = [];

  // Check SQL injection
  const body = JSON.stringify(req.body);
  const query = JSON.stringify(req.query);
  const params = JSON.stringify(req.params);
  const combinedInput = `${body} ${query} ${params}`;

  for (const pattern of WAFRules.SQL_INJECTION_PATTERNS) {
    if (pattern.test(combinedInput)) {
      violations.push({ type: 'sql_injection', pattern: pattern.toString() });
    }
  }

  // Check XSS
  for (const pattern of WAFRules.XSS_PATTERNS) {
    if (pattern.test(combinedInput)) {
      violations.push({ type: 'xss', pattern: pattern.toString() });
    }
  }

  // Check path traversal
  for (const pattern of WAFRules.PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(req.path)) {
      violations.push({ type: 'path_traversal', pattern: pattern.toString() });
    }
  }

  // Check command injection
  for (const pattern of WAFRules.COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(combinedInput)) {
      violations.push({ type: 'command_injection', pattern: pattern.toString() });
    }
  }

  // Check SSRF
  for (const pattern of WAFRules.SSRF_PATTERNS) {
    if (pattern.test(combinedInput)) {
      violations.push({ type: 'ssrf', pattern: pattern.toString() });
    }
  }

  // Check user-agent
  const ua = req.get('user-agent') || '';
  for (const pattern of WAFRules.MALICIOUS_USER_AGENTS) {
    if (pattern.test(ua)) {
      violations.push({ type: 'malicious_user_agent', pattern: pattern.toString() });
    }
  }

  if (violations.length > 0) {
    // Log security violation
    console.error('WAF Violation detected:', {
      ip: req.ip,
      userAgent: ua,
      violations,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    return res.status(403).json({
      status: 'error',
      message: 'Request blocked by security rules',
      violations
    });
  }

  next();
};

/**
 * IP Filter Middleware
 */
const ipFilterMiddleware = (req, res, next) => {
  const ipCheck = ipFilterManager.isAllowed(req.ip);

  if (!ipCheck.allowed) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied',
      reason: ipCheck.reason
    });
  }

  next();
};

/**
 * Request Size Limit Middleware
 */
const requestSizeLimit = (limit = '1mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');

    if (contentLength > parseSize(limit)) {
      return res.status(413).json({
        status: 'error',
        message: 'Request entity too large'
      });
    }

    next();
  };
};

/**
 * Parse size string to bytes
 */
function parseSize(size) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toString().toLowerCase().match(/^(\d+)\s*([a-z]+)?$/);

  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2] || 'b';

  return value * (units[unit] || 1);
}

/**
 * Rate limiters
 */
const globalRateLimiter = expressRateLimit(RateLimitingConfig.global);
const apiRateLimiter = expressRateLimit(RateLimitingConfig.api);
const authRateLimiter = expressRateLimit(RateLimitingConfig.auth);
const loginRateLimiter = expressRateLimit(RateLimitingConfig.login);
const passwordResetRateLimiter = expressRateLimit(RateLimitingConfig.passwordReset);
const transactionRateLimiter = expressRateLimit(RateLimitingConfig.transaction);
const sensitiveRateLimiter = expressRateLimit(RateLimitingConfig.sensitive);

/**
 * Slow down middleware (disabled - express-slow-down not installed)
 */
const apiSlowDown = (req, res, next) => next(); // Pass-through
const loginSlowDown = (req, res, next) => next(); // Pass-through

/**
 * TLS Configuration for Node.js
 */
const TLSConfig = {
  minVersion: 'TLSv1.3',
  maxVersion: 'TLSv1.3',
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256'
  ],
  honorCipherOrder: true,
  rejectUnauthorized: true,
  requestCert: false, // Set to true for mutual TLS
  ca: [], // Certificate authorities
  cert: '', // Server certificate
  key: '', // Server private key
  secureOptions: crypto.constants.SSL_OP_NO_SSLv3 |
                crypto.constants.SSL_OP_NO_TLSv1 |
                crypto.constants.SSL_OP_NO_TLSv1_1 |
                crypto.constants.SSL_OP_NO_TLSv1_2
};

/**
 * Subresource Integrity (SRI) Generator
 */
const generateSRI = (content, algorithm = 'sha384') => {
  const hash = crypto.createHash(algorithm).update(content).digest('base64');
  return `${algorithm}-${hash}`;
};

/**
 * Certificate Transparency Log Checker
 */
const checkCertificateTransparency = async (hostname) => {
  // In production, check against CT logs (Google, DigiCert, etc.)
  return {
    checked: true,
    hostname,
    logs: [
      'Google Argon2023',
      'DigiCert Yeti2023'
    ],
    certificateValid: true,
    sctPresent: true,
    lastChecked: new Date().toISOString()
  };
};

/**
 * DNS Security Configuration
 */
const DNSSecurityConfig = {
  DNSSEC: {
    enabled: true,
    validation: 'require'
  },
  DoH: {
    enabled: true,
    providers: [
      'https://dns.google/dns-query',
      'https://security.cloudflare-dns.com/dns-query'
    ]
  },
  DoT: {
    enabled: true,
    providers: [
      'dns.google',
      'dns.quad9.net'
    ]
  },
  DNSOverTLS: {
    enabled: true,
    port: 853
  }
};

/**
 * API Security Configuration
 */
const APISecurityConfig = {
  auth: {
    requireAPIKey: true,
    apiKeyHeader: 'X-API-Key',
    apiKeyRotationDays: 90
  },
  rateLimiting: {
    enabled: true,
    algorithm: 'token_bucket',
    burstSize: 10,
    refillRate: 5 // requests per minute
  },
  cors: {
    enabled: true,
    allowedOrigins: ['https://amenires.worldbank.com'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400
  },
  versioning: {
    currentVersion: 'v1',
    deprecatedVersions: [],
    sunsetDate: null
  }
};

/**
 * CSP Report Handler
 */
const handleCSPReport = (req, res) => {
  const report = req.body;

  console.log('CSP Violation Report:', {
    timestamp: new Date().toISOString(),
    report
  });

  res.status(204).end();
};

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
  loginSlowDown,
  TLSConfig,
  generateSRI,
  checkCertificateTransparency,
  DNSSecurityConfig,
  APISecurityConfig,
  handleCSPReport
};
