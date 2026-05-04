# Quick Start Guide - Enhanced Security Features

## Installation

1. Install all dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the server:
```bash
npm start
```

## Using Enhanced Authentication (v2 API)

### 1. CAPTCHA Generation

Before login, generate a CAPTCHA:

```bash
GET /api/auth/v2/captcha
```

Response:
```json
{
  "status": "success",
  "data": {
    "captchaId": "abc123...",
    "imageData": {
      "type": "image/png",
      "data": "base64-encoded-image"
    },
    "expiresAt": 1714627200000
  }
}
```

### 2. Enhanced Login

Login with full security stack:

```bash
POST /api/auth/v2/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "captchaId": "abc123...",
  "captcha": "ABC123",
  "mfaMethod": "totp",
  "mfaCode": "123456",
  "deviceProfile": {
    "platform": "Windows",
    "browser": "Chrome",
    "screenResolution": "1920x1080",
    "timezone": "America/New_York"
  },
  "location": {
    "lat": 40.7128,
    "lng": -74.0060,
    "country": "US",
    "city": "New York"
  },
  "behavioralData": {
    "keystrokes": [
      { "key": "a", "timestamp": 1714627200000, "releaseTime": 1714627200100 }
    ],
    "mouse": {
      "paths": [[100, 200], [110, 210], [120, 220]],
      "clicks": [{ "x": 100, "y": 200, "type": "click" }]
    }
  }
}
```

Response:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com",
      "accountType": "individual",
      "role": "customer",
      "twoFactorEnabled": true
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "sessionId": "abc123...",
    "expiresAt": 1714628100000,
    "riskScore": 15,
    "authLevel": "standard"
  }
}
```

### 3. Enhanced Registration

```bash
POST /api/auth/v2/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!@#",
  "captchaId": "abc123...",
  "captcha": "ABC123",
  "phone": "+1234567890",
  "country": "US",
  "continent": "North America",
  "accountType": "individual"
}
```

## Account Recovery

### 1. Initiate Recovery

```bash
POST /api/auth/v2/recovery
Content-Type: application/json

{
  "email": "user@example.com",
  "method": "email_otp"
}
```

Available methods:
- `email_otp` - Email verification
- `sms_otp` - SMS verification
- `security_questions` - Security questions
- `video_verification` - Video call with representative
- `in_person` - In-branch verification

### 2. Complete Recovery

```bash
POST /api/auth/v2/recovery/verify
Content-Type: application/json

{
  "token": "recovery-token...",
  "verificationCode": "123456",
  "newPassword": "NewSecurePassword456!@#"
}
```

## Checking Lockout Status

```bash
GET /api/auth/v2/lockout-status/:userId
Authorization: Bearer <token>
```

Response:
```json
{
  "status": "success",
  "data": {
    "lockoutStatus": {
      "type": "temporary",
      "reason": "failed_login_attempts",
      "expiresAt": "2024-05-02T15:00:00.000Z",
      "remainingTime": 900000,
      "attempts": 5
    },
    "ipLocked": false,
    "failedAttempts": 5,
    "recoveryOptions": {
      "selfService": [...],
      "manualRecovery": [...]
    }
  }
}
```

## Security Middleware Integration

### Using Fraud Detection

```javascript
const { generateFraudReport } = require('./middleware/fraudDetection');

// In your route handler
const fraudReport = generateFraudReport(req);

if (fraudReport.recommendedAction === 'block') {
  return res.status(403).json({
    status: 'error',
    message: 'Request blocked due to suspicious activity'
  });
}
```

### Using Session Management

```javascript
const { sessionManager } = require('./middleware/advancedSecurity');

// Create session
const session = sessionManager.createSession(userId, deviceProfile, req);

// Get session
const session = sessionManager.getSession(sessionId);

// Destroy session
sessionManager.destroySession(sessionId);

// Check for session hijacking
const hijackCheck = sessionManager.checkSessionHijacking(session, req);
if (hijackCheck.isHijacked) {
  console.warn('Session hijacking detected:', hijackCheck.anomalies);
}
```

### Using Account Lockout

```javascript
const { accountLockoutManager, handleLoginAttempt } = require('./middleware/accountLockout');

// Handle login attempt
const result = handleLoginAttempt(userId, ip, deviceFingerprint, success);

if (!result.allowed) {
  console.log('Login blocked:', result.lockoutStatus);
}

// Manually lock account
accountLockoutManager.lockAccountPermanently(userId, 'fraud_detected');

// Unlock account
accountLockoutManager.unlockAccount(userId);
```

### Using Logging

```javascript
const {
  logLoginEvent,
  logSecurityEvent,
  logAuditEvent,
  logBehavioralData
} = require('./middleware/logging');

// Log login event
await logLoginEvent({
  result: 'success',
  userId: userId,
  email: email,
  ip: req.ip,
  authenticationMethod: 'password',
  deviceFingerprint: deviceFingerprint,
  riskScore: fraudScore
});

// Log security event
await logSecurityEvent({
  severity: 'high',
  category: 'authentication',
  userId: userId,
  ip: req.ip,
  description: 'Multiple failed login attempts',
  actionTaken: 'account_locked'
});

// Log audit event
await logAuditEvent({
  action: 'PASSWORD_CHANGED',
  userId: userId,
  result: 'success'
});

// Log behavioral data
await logBehavioralData({
  userId: userId,
  sessionId: sessionId,
  ip: req.ip,
  keystrokes: keystrokeData,
  mouse: mouseData,
  touch: touchData
});
```

## MFA Implementation

### Setup TOTP

```javascript
const { generateTOTPSecret, generateTOTPQRCode } = require('./middleware/mfa');

const secret = generateTOTPSecret('user@example.com');
const qrCode = await generateTOTPQRCode(secret);

console.log('Secret:', secret.base32);
console.log('QR Code:', qrCode);
```

### Verify TOTP

```javascript
const { verifyTOTP } = require('./middleware/mfa');

const isValid = verifyTOTP(secret.base32, userCode);

if (isValid) {
  console.log('MFA verified successfully');
}
```

### Biometric Authentication

```javascript
const {
  generateBiometricChallenge,
  verifyBiometricResponse
} = require('./middleware/mfa');

// Generate challenge
const challenge = generateBiometricChallenge();

// Verify response
const isValid = verifyBiometricResponse(
  challenge,
  userBiometricData,
  storedBiometricTemplate
);
```

## Password Validation

```javascript
const { validatePassword } = require('./middleware/advancedSecurity');

const result = validatePassword('MyPassword123!', []);

if (!result.valid) {
  console.log('Password validation failed:', result.errors);
  console.log('Warnings:', result.warnings);
  console.log('Strength:', result.strength);
  console.log('Entropy:', result.entropy);
}
```

## Device Fingerprinting

```javascript
const { generateDeviceProfile } = require('./middleware/mfa');

const deviceProfile = generateDeviceProfile(req);

console.log('Device fingerprint hash:', deviceProfile.deviceFingerprint.hash);
console.log('Canvas fingerprint:', deviceProfile.canvasFingerprint);
console.log('WebGL fingerprint:', deviceProfile.webglFingerprint);
```

## Risk-Based Authentication

```javascript
const {
  calculateRiskScore,
  determineAuthLevel
} = require('./middleware/mfa');

const factors = {
  deviceReputation: 'unknown',
  locationAnomaly: 'new_location',
  behavioralMatch: 'medium',
  unusualTime: false,
  failedLoginAttempts: 2,
  highVelocity: false
};

const riskScore = calculateRiskScore(factors);
const authLevel = determineAuthLevel(riskScore);

console.log('Risk Score:', riskScore);
console.log('Auth Level:', authLevel.level);
console.log('MFA Factors Required:', authLevel.factorsRequired);
```

## Rate Limiting

Rate limiting is automatically applied by the middleware. Configuration:

```javascript
// Global rate limit: 1000 requests per 15 minutes
app.use('/api/', globalRateLimiter);

// API rate limit: 100 requests per minute
app.use('/api/', apiRateLimiter);

// Auth rate limit: 5 requests per 15 minutes
app.use('/api/auth', authRateLimiter);

// Login rate limit: 5 requests per 15 minutes
app.use('/api/auth/login', loginRateLimiter);
```

## WAF Rules

The Web Application Firewall automatically blocks requests with:
- SQL injection patterns
- XSS attempts
- Path traversal attacks
- Command injection
- SSRF attempts
- Malicious user agents

## IP Filtering

```javascript
const { ipFilterManager } = require('./middleware/infrastructureHardening');

// Add to whitelist
ipFilterManager.addToWhitelist('192.168.1.100');

// Add to blacklist
ipFilterManager.addToBlacklist('10.0.0.50');

// Check if IP is allowed
const check = ipFilterManager.isAllowed('192.168.1.1');
console.log('Allowed:', check.allowed);
console.log('Reason:', check.reason);
```

## Log Files

Logs are stored in the `./logs` directory:

- `audit-YYYY-MM-DD.log` - Audit events (10-year retention)
- `security-YYYY-MM-DD.log` - Security events
- `auth-YYYY-MM-DD.log` - Authentication events
- `transactions-YYYY-MM-DD.log` - Transaction events
- `behavioral-YYYY-MM-DD.log` - Behavioral biometrics data
- `performance-YYYY-MM-DD.log` - Performance metrics
- `error-YYYY-MM-DD.log` - Error logs

## Monitoring

### Health Check

```bash
GET /api/health
```

### System Status

```bash
GET /api/system/status
```

### Security Status

Check security metrics, threat levels, and lockout status through the admin dashboard.

## Best Practices

1. **Always use CAPTCHA** before login to prevent automated attacks
2. **Implement MFA** for all user accounts
3. **Log all events** for audit trails
4. **Monitor logs** in real-time
5. **Use enhanced API (v2)** for maximum security
6. **Validate passwords** using the validation module
7. **Implement rate limiting** on all endpoints
8. **Use device fingerprinting** to detect fraud
9. **Monitor risk scores** and take action on high-risk events
10. **Regular security audits** to identify vulnerabilities

## Troubleshooting

### User Locked Out
Check lockout status: `GET /api/auth/v2/lockout-status/:userId`
Use recovery flow: `POST /api/auth/v2/recovery`

### High Fraud Score
Review fraud report: Check logs for specific threats
Increase MFA requirements: Adjust auth level based on risk score

### CAPTCHA Failing
Regenerate CAPTCHA: `GET /api/auth/v2/captcha`
Check CAPTCHA expiry time

### Session Issues
Check session hijacking detection
Verify device fingerprint matches
Review session timeout settings

## Support

For security-related issues, contact:
- Security Operations Center: security@amenires.worldbank.com
- Technical Support: support@amenires.worldbank.com
- Emergency Hotline: +1-800-SECURITY

---

**Security Level**: MAXIMUM
**All security features are active and monitoring 24/7/365**
