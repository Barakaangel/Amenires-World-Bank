
const { generateSecurePassword } = require('../middleware/security');
const { SelfServiceRecovery } = require('../middleware/accountLockout');

function testGenerateSecurePassword() {
    console.log('Testing generateSecurePassword...');
    for (let i = 0; i < 5; i++) {
        const pw = generateSecurePassword(24);
        // Sensitive data should not be logged
        if (pw.length !== 24) throw new Error('Invalid password length');
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
