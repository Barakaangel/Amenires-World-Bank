## 2025-05-14 - Insecure Randomness in Security-Sensitive Logic
**Vulnerability:** Use of `Math.random()` for 24-character password generation and 6-digit OTP generation.
**Learning:** The application relied on `Math.random()` for generating critical security secrets. Additionally, it used `array.sort(() => Math.random() - 0.5)` for shuffling passwords, which is biased and not cryptographically secure.
**Prevention:** Always use the Node.js `crypto` module (`crypto.randomInt` or `crypto.randomBytes`) for generating any security-sensitive values. Implement the Fisher-Yates shuffle algorithm for cryptographically secure element randomization.
