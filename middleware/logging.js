/**
 * Comprehensive Logging, Monitoring & Auditing System for Amenires World Bank
 * Login events, behavioral logging, security logging, audit & compliance
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

/**
 * Log Configuration
 */
const LogConfig = {
  LOG_DIR: path.join(__dirname, '../logs'),
  RETENTION_DAYS: 3650, // 10 years for compliance
  MAX_SIZE: '100m',
  MAX_FILES: '30d',
  DATE_PATTERN: 'YYYY-MM-DD',
  TIMEZONE: 'UTC',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

/**
 * Ensure log directory exists
 */
if (!fs.existsSync(LogConfig.LOG_DIR)) {
  fs.mkdirSync(LogConfig.LOG_DIR, { recursive: true });
}

/**
 * Custom log formats
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ timezone: LogConfig.TIMEZONE }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

/**
 * Audit logger for compliance
 */
const auditLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(LogConfig.LOG_DIR, 'audit-%DATE%.log'),
      datePattern: LogConfig.DATE_PATTERN,
      maxSize: LogConfig.MAX_SIZE,
      maxFiles: LogConfig.MAX_FILES,
      auditFile: path.join(LogConfig.LOG_DIR, '.audit-audit.json')
    })
  ],
  exitOnError: false
});

/**
 * Security logger
 */
const securityLogger = winston.createLogger({
  level: 'warn',
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(LogConfig.LOG_DIR, 'security-%DATE%.log'),
      datePattern: LogConfig.DATE_PATTERN,
      maxSize: LogConfig.MAX_SIZE,
      maxFiles: LogConfig.MAX_FILES
    })
  ],
  exitOnError: false
});

/**
 * Authentication logger
 */
const authLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(LogConfig.LOG_DIR, 'auth-%DATE%.log'),
      datePattern: LogConfig.DATE_PATTERN,
      maxSize: LogConfig.MAX_SIZE,
      maxFiles: LogConfig.MAX_FILES
    })
  ],
  exitOnError: false
});

/**
 * Transaction logger
 */
const transactionLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(LogConfig.LOG_DIR, 'transactions-%DATE%.log'),
      datePattern: LogConfig.DATE_PATTERN,
      maxSize: LogConfig.MAX_SIZE,
      maxFiles: LogConfig.MAX_FILES
    })
  ],
  exitOnError: false
});

/**
 * Behavioral logger
 */
const behavioralLogger = winston.createLogger({
  level: 'debug',
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(LogConfig.LOG_DIR, 'behavioral-%DATE%.log'),
      datePattern: LogConfig.DATE_PATTERN,
      maxSize: LogConfig.MAX_SIZE,
      maxFiles: LogConfig.MAX_FILES
    })
  ],
  exitOnError: false
});

/**
 * Performance logger
 */
const performanceLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(LogConfig.LOG_DIR, 'performance-%DATE%.log'),
      datePattern: LogConfig.DATE_PATTERN,
      maxSize: LogConfig.MAX_SIZE,
      maxFiles: LogConfig.MAX_FILES
    })
  ],
  exitOnError: false
});

/**
 * Error logger
 */
const errorLogger = winston.createLogger({
  level: 'error',
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(LogConfig.LOG_DIR, 'error-%DATE%.log'),
      datePattern: LogConfig.DATE_PATTERN,
      maxSize: LogConfig.MAX_SIZE,
      maxFiles: LogConfig.MAX_FILES
    })
  ],
  exitOnError: false
});

/**
 * Add console transport in development
 */
if (process.env.NODE_ENV !== 'production') {
  auditLogger.add(new winston.transports.Console({ format: consoleFormat }));
  securityLogger.add(new winston.transports.Console({ format: consoleFormat }));
  authLogger.add(new winston.transports.Console({ format: consoleFormat }));
  transactionLogger.add(new winston.transports.Console({ format: consoleFormat }));
  errorLogger.add(new winston.transports.Console({ format: consoleFormat }));
}

/**
 * Login Event Logging
 */
const logLoginEvent = async (data) => {
  const event = {
    eventType: 'LOGIN',
    timestamp: new Date().toISOString(),
    timestampMs: Date.now(),
    userId: data.userId,
    maskedUsername: maskIdentifier(data.username || data.email),
    email: data.email,
    authenticationResult: data.result, // success, failure, partial
    authenticationMethod: data.method, // password, biometric, security_key, otp, etc.
    mfaChallengeDetails: data.mfaDetails || null,
    ipAddress: data.ip,
    ipVersion: data.ip.includes(':') ? 'IPv6' : 'IPv4',
    geolocation: data.geolocation || null,
    networkInformation: {
      isp: data.isp || 'unknown',
      connectionType: data.connectionType || 'unknown',
      asn: data.asn || null
    },
    deviceFingerprint: data.deviceFingerprint || null,
    deviceProfile: data.deviceProfile || null,
    deviceId: data.deviceId || null,
    userAgent: data.userAgent,
    sessionTokenId: data.sessionTokenId || null,
    failureReason: data.failureReason || null,
    attemptCount: data.attemptCount || 1,
    consecutiveFailures: data.consecutiveFailures || 0,
    riskScore: data.riskScore || 0,
    captchaResult: data.captchaResult || null,
    httpHeaders: data.headers ? sanitizeHeaders(data.headers) : null,
    referrerUrl: data.referrer || null,
    tlsDetails: data.tlsDetails || null
  };

  authLogger.info('LOGIN_EVENT', event);

  if (data.result === 'failure') {
    securityLogger.warn('LOGIN_FAILURE', {
      ...event,
      reason: data.failureReason || 'Unknown reason'
    });
  }
};

/**
 * Transaction Logging
 */
const logTransaction = async (data) => {
  const event = {
    eventType: 'TRANSACTION',
    timestamp: new Date().toISOString(),
    timestampMs: Date.now(),
    transactionId: data.transactionId,
    referenceNumber: data.referenceNumber,
    userId: data.userId,
    maskedAccount: maskIdentifier(data.accountNumber),
    accountType: data.accountType,
    transactionType: data.type, // transfer, deposit, withdrawal, payment
    amount: data.amount,
    currency: data.currency,
    amountUSD: data.amountUSD || null,
    recipientAccount: data.recipientAccount ? maskIdentifier(data.recipientAccount) : null,
    recipientName: data.recipientName || null,
    recipientBank: data.recipientBank || null,
    sourceCountry: data.sourceCountry,
    destinationCountry: data.destinationCountry,
    ip: data.ip,
    geolocation: data.geolocation || null,
    deviceFingerprint: data.deviceFingerprint || null,
    status: data.status, // pending, completed, failed, cancelled
    reasonCode: data.reasonCode || null,
    riskScore: data.riskScore || 0,
    fraudFlags: data.fraudFlags || [],
    approvalRequired: data.approvalRequired || false,
    approvedBy: data.approvedBy || null,
    approvalTimestamp: data.approvalTimestamp || null
  };

  transactionLogger.info('TRANSACTION', event);

  if (data.riskScore > 50 || (data.fraudFlags && data.fraudFlags.length > 0)) {
    securityLogger.warn('HIGH_RISK_TRANSACTION', event);
  }

  await logAuditEvent({
    action: 'TRANSACTION_EXECUTED',
    userId: data.userId,
    transactionId: data.transactionId,
    amount: data.amount,
    status: data.status
  });
};

/**
 * Behavioral Logging
 */
const logBehavioralData = async (data) => {
  const event = {
    eventType: 'BEHAVIORAL',
    timestamp: new Date().toISOString(),
    timestampMs: Date.now(),
    userId: data.userId,
    sessionId: data.sessionId,
    ipAddress: data.ip,

    keystrokeDynamics: {
      typingCadence: data.keystrokes?.cadence || null,
      typingSpeed: data.keystrokes?.speed || null, // characters per second
      dwellTime: data.keystrokes?.dwellTime || null, // average key press duration
      flightTime: data.keystrokes?.flightTime || null, // average time between keys
      keyHoldVariance: data.keystrokes?.variance || null
    },

    mousePatterns: {
      movementPaths: data.mouse?.paths || null,
      velocity: data.mouse?.velocity || null, // pixels per second
      acceleration: data.mouse?.acceleration || null,
      clickCoordinates: data.mouse?.clicks || null,
      clickPatterns: data.mouse?.patterns || null
    },

    touchMetrics: data.touch ? {
      pressure: data.touch.pressure || null,
      swipeVelocity: data.touch.swipeVelocity || null,
      tilt: data.touch.tilt || null,
      multitouchPatterns: data.touch.multitouch || null,
      gestureType: data.touch.gestureType || null
    } : null,

    pageInteractions: {
      timeOnPage: data.pageInteractions?.timeOnPage || null,
      fieldFocusOrder: data.pageInteractions?.fieldOrder || null,
      copyPasteEvents: data.pageInteractions?.copyPaste || [],
      autofillDetected: data.pageInteractions?.autofill || false
    },

    sessionMetrics: {
      totalInteractions: data.totalInteractions || 0,
      uniqueActions: data.uniqueActions || 0
    }
  };

  behavioralLogger.debug('BEHAVIORAL_DATA', event);
};

/**
 * Security Event Logging
 */
const logSecurityEvent = async (data) => {
  const event = {
    eventType: 'SECURITY',
    timestamp: new Date().toISOString(),
    timestampMs: Date.now(),
    severity: data.severity, // low, medium, high, critical
    category: data.category, // authentication, authorization, fraud, malware, data_breach
    userId: data.userId || null,
    ipAddress: data.ip,
    eventDescription: data.description,
    threatDetails: data.threatDetails || null,
    botDetectionScore: data.botScore || null,
    malwareIndicators: data.malwareIndicators || [],
    riskScore: data.riskScore || 0,
    actionTaken: data.actionTaken || 'logged',
    blocked: data.blocked || false,
    correlationId: data.correlationId || generateCorrelationId()
  };

  securityLogger.warn('SECURITY_EVENT', event);

  if (data.severity === 'critical' || data.blocked) {
    await logAuditEvent({
      action: 'SECURITY_BREACH_ATTEMPT',
      severity: data.severity,
      userId: data.userId,
      ip: data.ip,
      description: data.description,
      actionTaken: data.actionTaken
    });
  }
};

/**
 * Audit Event Logging
 */
const logAuditEvent = async (data) => {
  const event = {
    eventType: 'AUDIT',
    timestamp: new Date().toISOString(),
    timestampMs: Date.now(),
    action: data.action,
    userId: data.userId || null,
    userEmail: data.userEmail ? maskIdentifier(data.userEmail) : null,
    targetUserId: data.targetUserId || null,
    resourceType: data.resourceType || null,
    resourceId: data.resourceId || null,
    oldValues: data.oldValues || null,
    newValues: data.newValues || null,
    result: data.result || 'success',
    failureReason: data.failureReason || null,
    ipAddress: data.ip,
    userAgent: data.userAgent,
    sessionId: data.sessionId || null,
    geolocation: data.geolocation || null,
    additionalDetails: data.details || {}
  };

  auditLogger.info('AUDIT', event);
};

/**
 * Compliance Logging
 */
const logComplianceEvent = async (data) => {
  const event = {
    eventType: 'COMPLIANCE',
    timestamp: new Date().toISOString(),
    timestampMs: Date.now(),
    regulation: data.regulation, // GDPR, CCPA, GLBA, SOX, etc.
    complianceEvent: data.event,
    userId: data.userId || null,
    dataProcessed: {
      dataTypes: data.dataTypes || [],
      dataVolume: data.dataVolume || 0,
      dataRetentionPeriod: data.retentionPeriod || null
    },
    consent: {
      obtained: data.consentObtained || false,
      timestamp: data.consentTimestamp || null,
      version: data.consentVersion || null
    },
    dataTransfer: {
      crossBorder: data.crossBorder || false,
      destinationCountry: data.destinationCountry || null,
      dataProtection: data.dataProtection || null
    },
    retention: {
      requiredPeriod: data.requiredRetention || null,
      scheduledDeletion: data.scheduledDeletion || null
    }
  };

  auditLogger.info('COMPLIANCE', event);
};

/**
 * Performance Logging
 */
const logPerformance = async (data) => {
  const event = {
    eventType: 'PERFORMANCE',
    timestamp: new Date().toISOString(),
    timestampMs: Date.now(),
    endpoint: data.endpoint,
    method: data.method,
    responseTime: data.responseTime,
    statusCode: data.statusCode,
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    userId: data.userId || null,
    sessionId: data.sessionId || null,
    customMetrics: data.customMetrics || {}
  };

  performanceLogger.info('PERFORMANCE', event);

  // Log slow requests
  if (data.responseTime > 5000) {
    errorLogger.warn('SLOW_REQUEST', event);
  }
};

/**
 * Error Logging
 */
const logError = async (data) => {
  const event = {
    eventType: 'ERROR',
    timestamp: new Date().toISOString(),
    timestampMs: Date.now(),
    errorType: data.type,
    errorCode: data.code,
    errorMessage: data.message,
    stackTrace: data.stack,
    userId: data.userId || null,
    sessionId: data.sessionId || null,
    endpoint: data.endpoint || null,
    method: data.method || null,
    requestBody: data.requestBody ? sanitizeRequestBody(data.requestBody) : null,
    ipAddress: data.ip,
    userAgent: data.userAgent,
    correlationId: data.correlationId || generateCorrelationId(),
    additionalContext: data.context || {}
  };

  errorLogger.error('ERROR', event);

  // Log to audit for critical errors
  if (data.severity === 'critical') {
    await logAuditEvent({
      action: 'CRITICAL_ERROR',
      userId: data.userId,
      errorType: data.type,
      errorMessage: data.message
    });
  }
};

/**
 * Privileged Access Logging
 */
const logPrivilegedAccess = async (data) => {
  const event = {
    eventType: 'PRIVILEGED_ACCESS',
    timestamp: new Date().toISOString(),
    timestampMs: Date.now(),
    adminUserId: data.adminUserId,
    adminRole: data.adminRole,
    targetUserId: data.targetUserId,
    action: data.action,
    resource: data.resource,
    resourceId: data.resourceId,
    ipAddress: data.ip,
    reason: data.reason,
    approvedBy: data.approvedBy || null,
    approvalReference: data.approvalRef || null,
    beforeState: data.beforeState || null,
    afterState: data.afterState || null
  };

  securityLogger.warn('PRIVILEGED_ACCESS', event);
  await logAuditEvent({
    action: 'PRIVILEGED_ACTION',
    userId: data.adminUserId,
    targetUserId: data.targetUserId,
    action: data.action,
    resource: data.resource
  });
};

/**
 * Helper functions
 */
function maskIdentifier(identifier) {
  if (!identifier) return null;

  if (identifier.includes('@')) {
    // Email: show first 2 chars and domain
    const [local, domain] = identifier.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  } else if (identifier.length > 8) {
    // Account/ID: show first 4 and last 4
    return `${identifier.substring(0, 4)}...${identifier.substring(identifier.length - 4)}`;
  } else {
    return `${identifier.substring(0, 1)}***`;
  }
}

function sanitizeHeaders(headers) {
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  const sanitized = { ...headers };

  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}

function sanitizeRequestBody(body) {
  const sensitiveFields = ['password', 'pin', 'otp', 'ssn', 'creditCard', 'cvv'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

function generateCorrelationId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Log query function for searching logs
 */
const queryLogs = async (criteria) => {
  // In production, this would query Elasticsearch or Splunk
  // For now, this is a placeholder
  return {
    query: criteria,
    message: 'Log query functionality requires integration with SIEM system (Splunk, ELK, etc.)'
  };
};

/**
 * Generate log integrity hash
 */
const generateLogIntegrityHash = (logData) => {
  const logString = JSON.stringify(logData);
  return crypto.createHash('sha256').update(logString).digest('hex');
};

/**
 * Immutable log storage simulation
 */
const storeImmutableLog = async (logData) => {
  const integrityHash = generateLogIntegrityHash(logData);
  const immutableLog = {
    ...logData,
    integrityHash,
    storedAt: Date.now(),
    storedBy: 'AmeniresWorldBank',
    blockchainHash: generateBlockchainHash(logData, integrityHash)
  };

  // In production, store in WORM storage or blockchain
  auditLogger.info('IMMUTABLE_LOG', immutableLog);
  return immutableLog;
};

function generateBlockchainHash(logData, integrityHash) {
  const combined = `${JSON.stringify(logData)}|${integrityHash}|${Date.now()}`;
  return crypto.createHash('sha512').update(combined).digest('hex');
}

module.exports = {
  LogConfig,
  logLoginEvent,
  logTransaction,
  logBehavioralData,
  logSecurityEvent,
  logAuditEvent,
  logComplianceEvent,
  logPerformance,
  logError,
  logPrivilegedAccess,
  queryLogs,
  generateLogIntegrityHash,
  storeImmutableLog,
  auditLogger,
  securityLogger,
  authLogger,
  transactionLogger,
  behavioralLogger,
  performanceLogger,
  errorLogger
};
