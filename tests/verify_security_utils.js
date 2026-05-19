const Module = require('module');
const originalRequire = Module.prototype.require;

// Mock bcryptjs
Module.prototype.require = function(path) {
  if (path === 'bcryptjs') {
    return {
      hash: async (p, s) => 'hashed_' + p,
      compare: async (p, h) => h === 'hashed_' + p
    };
  }
  return originalRequire.apply(this, arguments);
};

const { generateSecurePassword, validatePasswordStrength } = require('../middleware/security');
const assert = require('assert');

console.log('Testing generateSecurePassword...');

// Test default length
const pwd1 = generateSecurePassword();
assert.strictEqual(pwd1.length, 24, 'Default length should be 24');

// Test custom length
const pwd2 = generateSecurePassword(32);
assert.strictEqual(pwd2.length, 32, 'Custom length should be 32');

// Test character variety and strength
const strength = validatePasswordStrength(pwd1);
assert.strictEqual(strength.valid, true, 'Generated password should be valid by strength rules');
assert.strictEqual(strength.score, 5, 'Generated password should meet all 5 complexity criteria');

// Test randomness (very basic)
const passwords = new Set();
for(let i = 0; i < 100; i++) {
    passwords.add(generateSecurePassword(12));
}
assert.strictEqual(passwords.size, 100, '100 generated passwords should be unique');

console.log('✅ All tests passed!');
