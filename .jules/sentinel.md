## 2025-05-15 - Insecure Randomness in Security-Sensitive Contexts
**Vulnerability:** The codebase consistently used `Math.random()` for generating passwords, transaction references, and OTP codes.
**Learning:** `Math.random()` in Node.js is not cryptographically secure and its output can be predicted, which is a critical risk for a banking application.
**Prevention:** Always use the `crypto` module (`crypto.randomInt`, `crypto.randomBytes`) for any security-sensitive random data. Implement secure shuffling (e.g., Fisher-Yates) instead of relying on `Array.sort(() => Math.random() - 0.5)`.
