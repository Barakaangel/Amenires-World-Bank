# Sentinel Security Journal 🛡️

## 2025-05-14 - Insecure Randomness for Security-Sensitive Operations
**Vulnerability:** Use of `Math.random()` for password generation, OTP generation, and transaction references. `Math.random()` is not cryptographically secure and can be predictable.
**Learning:** The codebase frequently uses `Math.random()` even in `middleware/security.js`, which is supposed to provide secure utilities. This suggests a pattern where developers prioritized convenience or standard JS features over security-grade randomness.
**Prevention:** Always use the Node.js `crypto` module (`crypto.randomInt`, `crypto.randomBytes`) for any security-sensitive random values. Implement the Fisher-Yates algorithm for secure shuffling instead of `Array.prototype.sort()` with `Math.random()`.
