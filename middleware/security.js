/**
 * Security Middleware Functions
 * Password generation, validation, and audit logging
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Generate Secure Password
 */
const generateSecurePassword = (length = 24) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = [];
  
  // Ensure at least one of each type using crypto.randomInt
  password.push(uppercase[crypto.randomInt(0, uppercase.length)]);
  password.push(lowercase[crypto.randomInt(0, lowercase.length)]);
  password.push(numbers[crypto.randomInt(0, numbers.length)]);
  password.push(symbols[crypto.randomInt(0, symbols.length)]);
  
  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password.push(allChars[crypto.randomInt(0, allChars.length)]);
  }
  
  // Secure Fisher-Yates Shuffle
  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
};

/**
 * Validate Password Strength
 */
const validatePasswordStrength = (password) => {
  const result = {
    valid: false,
    score: 0,
    feedback: []
  };
  
  if (password.length < 12) {
    result.feedback.push('Password must be at least 12 characters');
  } else {
    result.score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    result.feedback.push('Password must contain uppercase letters');
  } else {
    result.score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    result.feedback.push('Password must contain lowercase letters');
  } else {
    result.score += 1;
  }
  
  if (!/[0-9]/.test(password)) {
    result.feedback.push('Password must contain numbers');
  } else {
    result.score += 1;
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    result.feedback.push('Password must contain special characters');
  } else {
    result.score += 1;
  }
  
  result.valid = result.score >= 4;
  
  return result;
};

/**
 * Generate Secure Token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate Reference Number
 */
const generateReferenceNumber = (prefix = 'REF') => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generate Transaction ID
 */
const generateTransactionId = (prefix = 'TXN') => {
  const timestamp = Date.now().toString();
  const random = crypto.randomInt(100000, 999999).toString();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Audit Log (simplified version)
 */
const auditLog = async (action, userId, details = {}) => {
  try {
    console.log(`[AUDIT] ${action} | User: ${userId} | Details:`, details);
    // In production, this would save to database
    return true;
  } catch (error) {
    console.error('Audit log error:', error);
    return false;
  }
};

/**
 * Sanitize Input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate Email
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Phone Number
 */
const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,20}$/;
  return phoneRegex.test(phone);
};

module.exports = {
  generateSecurePassword,
  validatePasswordStrength,
  generateSecureToken,
  generateReferenceNumber,
  generateTransactionId,
  auditLog,
  sanitizeInput,
  validateEmail,
  validatePhone
};
