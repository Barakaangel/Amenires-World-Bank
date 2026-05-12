
const crypto = require('crypto');

/**
 * Generate Secure Password
 */
const generateSecurePassword = (length = 24) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';

  // Ensure at least one of each type
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += symbols[crypto.randomInt(0, symbols.length)];

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }

  // Shuffle the password using Fisher-Yates algorithm with CSPRNG
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }
  return passwordArray.join('');
};

/**
 * Self-Service Password Reset
 */
class SelfServiceRecovery {
  /**
   * Initiate SMS-based password reset
   */
  static initiateSMSReset(phoneNumber) {
    const otp = crypto.randomInt(100000, 1000000).toString();
    // In production, send SMS with OTP
    return {
      method: 'sms',
      otp,
      message: 'OTP sent via SMS',
      expiresIn: 300 // 5 minutes
    };
  }
}

function testGenerateSecurePassword() {
    console.log('Testing generateSecurePassword...');
    for (let i = 0; i < 5; i++) {
        const pw = generateSecurePassword(24);
        console.log(`Generated Password ${i+1}: ${pw}`);
        if (pw.length !== 24) throw new Error('Invalid password length');

        // Basic check for character diversity
        const hasUpper = /[A-Z]/.test(pw);
        const hasLower = /[a-z]/.test(pw);
        const hasNum = /[0-9]/.test(pw);
        const hasSym = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pw);
        if (!(hasUpper && hasLower && hasNum && hasSym)) {
            throw new Error('Password missing required character types: ' + pw);
        }
    }
    console.log('generateSecurePassword test passed.\n');
}

function testInitiateSMSReset() {
    console.log('Testing SelfServiceRecovery.initiateSMSReset...');
    for (let i = 0; i < 5; i++) {
        const result = SelfServiceRecovery.initiateSMSReset('+1234567890');
        console.log(`Generated OTP ${i+1}: ${result.otp}`);
        if (!/^\d{6}$/.test(result.otp)) throw new Error('Invalid OTP format: ' + result.otp);
    }
    console.log('SelfServiceRecovery.initiateSMSReset test passed.\n');
}

try {
    testGenerateSecurePassword();
    testInitiateSMSReset();
    console.log('All randomness tests passed!');
} catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
}
