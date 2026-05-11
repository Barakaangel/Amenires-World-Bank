const crypto = require('crypto');

// Copy logic from middleware/security.js
const generateSecurePassword = (length = 24) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';

  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += symbols[crypto.randomInt(0, symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }

  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }
  return passwordArray.join('');
};

// Copy logic from middleware/accountLockout.js
const initiateSMSReset = (phoneNumber) => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  return {
    method: 'sms',
    otp,
    message: 'OTP sent via SMS',
    expiresIn: 300
  };
};

// Copy logic from config/bankIdentity.js
function generateRoutingNumber() {
  const digits = [];
  for (let i = 0; i < 8; i++) {
    digits.push(crypto.randomInt(0, 10));
  }

  const weights = [3, 7, 1, 3, 7, 1, 3, 7];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * weights[i];
  }
  const checksum = (10 - (sum % 10)) % 10;
  digits.push(checksum);

  return digits.join('');
}

function generateIBAN() {
  const countryCode = 'GB';
  const checkDigits = crypto.randomInt(10, 100);
  const bankCode = 'AMEN';
  const sortCode = generateRoutingNumber().substring(0, 6);
  const accountNumber = crypto.randomBytes(8).toString('hex').toUpperCase().substring(0, 8);

  return `${countryCode}${checkDigits}${bankCode}${sortCode}${accountNumber}`;
}

const assert = require('assert');

console.log('🧪 Verifying Secure Randomness Fixes (Isolated Logic)...');

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
const recovery = initiateSMSReset('+1234567890');
console.log(`Generated OTP: ${recovery.otp}`);
assert.strictEqual(recovery.otp.length, 6, 'OTP should be 6 digits long');
assert.match(recovery.otp, /^\d{6}$/, 'OTP should only contain digits');
console.log('✅ OTP generation verified.');

// Test 3: Routing Number
console.log('Testing Routing Number...');
const routingNumber = generateRoutingNumber();
console.log(`Generated Routing Number: ${routingNumber}`);
assert.strictEqual(routingNumber.length, 9, 'Routing number should be 9 digits long');
assert.match(routingNumber, /^\d{9}$/, 'Routing number should only contain digits');
console.log('✅ Routing number verified.');

// Test 4: IBAN
console.log('Testing IBAN...');
const iban = generateIBAN();
console.log(`Generated IBAN: ${iban}`);
assert.strictEqual(iban.startsWith('GB'), true, 'IBAN should start with GB');
console.log('✅ IBAN verified.');

console.log('\n✨ All secure randomness verifications passed!');
