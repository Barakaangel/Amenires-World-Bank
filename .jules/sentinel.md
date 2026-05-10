## 2025-05-14 - Insecure Randomness in Security Functions
**Vulnerability:** Use of `Math.random()` for generating secure passwords and SMS OTPs.
**Learning:** `Math.random()` in Node.js is not cryptographically secure and can be predictable if the seed is known or guessed. This makes generated passwords and OTPs vulnerable to brute-force or prediction attacks.
**Prevention:** Always use `crypto.randomInt()` or `crypto.randomBytes()` for any security-sensitive random number generation in Node.js.
