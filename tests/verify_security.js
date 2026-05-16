const Module = require('module');
const originalRequire = Module.prototype.require;

// Mock bcryptjs before requiring the middleware
Module.prototype.require = function(path) {
  if (path === 'bcryptjs') {
    return {
      hash: async () => 'hashed',
      compare: async () => true
    };
  }
  return originalRequire.apply(this, arguments);
};

const { generateSecurePassword, validatePasswordStrength } = require('../middleware/security');

function testGenerateSecurePassword() {
  console.log('Testing generateSecurePassword from middleware/security.js...');

  for (let i = 0; i < 100; i++) {
    const password = generateSecurePassword(24);
    const strength = validatePasswordStrength(password);

    if (!strength.valid) {
      console.error(`FAILED: Password "${password}" is not strong enough.`);
      console.error('Feedback:', strength.feedback);
      process.exit(1);
    }

    if (password.length !== 24) {
      console.error(`FAILED: Password length is ${password.length}, expected 24.`);
      process.exit(1);
    }
  }

  console.log('PASSED: 100 strong passwords generated successfully from middleware.');
}

try {
  testGenerateSecurePassword();
} catch (error) {
  console.error('An error occurred during testing:', error);
  process.exit(1);
}
