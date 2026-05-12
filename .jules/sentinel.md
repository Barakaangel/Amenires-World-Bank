## 2025-05-15 - Insecure Randomness Pattern
**Vulnerability:** Use of `Math.random()` for security-sensitive operations including password generation, OTP generation, and shuffling.
**Learning:** `Math.random()` is a PRNG that is not cryptographically secure, making generated secrets predictable. Shuffling with `sort(() => Math.random() - 0.5)` is also biased and insecure.
**Prevention:** Always use the Node.js `crypto` module (CSPRNG). Use `crypto.randomInt()` for ranges/indexing and `crypto.randomBytes()` for tokens. Implement Fisher-Yates for secure, unbiased shuffling.
