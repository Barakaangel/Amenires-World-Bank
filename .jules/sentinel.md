## 2025-05-22 - [Secure Randomness]
**Vulnerability:** Use of `Math.random()` for security-sensitive operations like password generation and OTP creation.
**Learning:** `Math.random()` is PRNG (Pseudo-Random Number Generator) and is not cryptographically secure, making generated secrets predictable if the internal state is discovered.
**Prevention:** Always use the Node.js `crypto` module (e.g., `crypto.randomInt`, `crypto.randomBytes`) for security-related random values. For shuffling, implement a secure Fisher-Yates algorithm instead of `sort(() => Math.random() - 0.5)`.
