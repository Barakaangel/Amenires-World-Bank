
// Mock missing modules for standalone testing
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(path) {
  if (path === 'bcryptjs' || path === 'argon2' || path === 'zxcvbn') {
    return {};
  }
  return originalRequire.apply(this, arguments);
};

const { generateSecurePassword } = require('../middleware/security');
const { SelfServiceRecovery } = require('../middleware/accountLockout');
const crypto = require('crypto');

function testSecurePassword() {
  console.log('Testing generateSecurePassword...');
  const password = generateSecurePassword(32);
  console.log(`Generated Password: ${password}`);

  if (password.length !== 32) {
    throw new Error(`Expected length 32, got ${password.length}`);
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    throw new Error('Password missing required character types');
  }

  console.log('✓ generateSecurePassword test passed');
}

function testSMSOTP() {
  console.log('Testing initiateSMSReset OTP...');
  const result = SelfServiceRecovery.initiateSMSReset('1234567890');
  console.log(`Generated OTP: ${result.otp}`);

  if (result.otp.length !== 6) {
    throw new Error(`Expected OTP length 6, got ${result.otp.length}`);
  }

  if (!/^\d{6}$/.test(result.otp)) {
    throw new Error('OTP should only contain digits');
  }

  console.log('✓ initiateSMSReset OTP test passed');
}

try {
  testSecurePassword();
  testSMSOTP();
  console.log('\nAll security verification tests passed!');
} catch (error) {
  console.error(`\nTest failed: ${error.message}`);
  process.exit(1);
}
