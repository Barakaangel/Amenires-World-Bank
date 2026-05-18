/**
 * Standalone test for security middleware without dependencies
 */
const Module = require('module');
const originalRequire = Module.prototype.require;

// Mock missing dependencies
Module.prototype.require = function(path) {
  if (path === 'bcryptjs') {
    return {
      hash: async () => 'hashed',
      compare: async () => true
    };
  }
  return originalRequire.apply(this, arguments);
};

const { generateSecurePassword, validatePasswordStrength, generateReferenceNumber } = require('../middleware/security');
const crypto = require('crypto');

console.log('Testing secure password generation...');

for (let i = 0; i < 100; i++) {
  const password = generateSecurePassword(24);
  const strength = validatePasswordStrength(password);

  if (!strength.valid) {
    console.error('FAILED: Generated password failed strength validation:', strength.feedback);
    process.exit(1);
  }
}

console.log('SUCCESS: All 100 generated passwords passed validation.');

// Check if Math.random was used
const originalMathRandom = Math.random;
let mathRandomCalled = false;
Math.random = () => {
  mathRandomCalled = true;
  return originalMathRandom();
};

generateSecurePassword(24);

if (mathRandomCalled) {
  console.error('FAILED: Math.random() was called during password generation!');
  process.exit(1);
} else {
  console.log('SUCCESS: Math.random() was NOT called during password generation.');
}

// Test reference number generation
console.log('Testing reference number generation...');
const ref = generateReferenceNumber('TRF');
console.log(`Generated reference: ${ref}`);
if (!ref.startsWith('TRF-')) {
  console.error('FAILED: Reference number should start with TRF-');
  process.exit(1);
}

Math.random = originalMathRandom;
console.log('Verification completed successfully!');
