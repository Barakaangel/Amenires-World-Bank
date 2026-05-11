const { generateSecurePassword } = require('../middleware/security');
const { SelfServiceRecovery } = require('../middleware/accountLockout');
const bankIdentity = require('../config/bankIdentity');
const assert = require('assert');

console.log('🧪 Verifying Secure Randomness Fixes...');

// Test 1: Password Generation
console.log('Testing generateSecurePassword...');
const password = generateSecurePassword(24);
assert.strictEqual(password.length, 24, 'Password should be 24 characters long');
assert.match(password, /[A-Z]/, 'Password should contain uppercase letters');
assert.match(password, /[a-z]/, 'Password should contain lowercase letters');
assert.match(password, /[0-9]/, 'Password should contain numbers');
assert.match(password, /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/, 'Password should contain symbols');
console.log('✅ Password generation verified.');

// Test 2: OTP Generation
console.log('Testing initiateSMSReset OTP...');
const recovery = SelfServiceRecovery.initiateSMSReset('+1234567890');
console.log(`Generated OTP: ${recovery.otp}`);
assert.strictEqual(recovery.otp.length, 6, 'OTP should be 6 digits long');
assert.match(recovery.otp, /^\d{6}$/, 'OTP should only contain digits');
console.log('✅ OTP generation verified.');

// Test 3: Routing Number
console.log('Testing Routing Number...');
const routingNumber = bankIdentity.codes.routingNumber;
console.log(`Generated Routing Number: ${routingNumber}`);
assert.strictEqual(routingNumber.length, 9, 'Routing number should be 9 digits long');
assert.match(routingNumber, /^\d{9}$/, 'Routing number should only contain digits');
console.log('✅ Routing number verified.');

// Test 4: IBAN
console.log('Testing IBAN...');
const iban = bankIdentity.codes.iban;
console.log(`Generated IBAN: ${iban}`);
assert.strictEqual(iban.startsWith('GB'), true, 'IBAN should start with GB');
console.log('✅ IBAN verified.');

console.log('\n✨ All secure randomness verifications passed!');
