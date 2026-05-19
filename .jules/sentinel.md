## 2026-05-19 - [Secure Randomness in Financial Systems]
**Vulnerability:** Use of `Math.random()` for security-sensitive logic including password generation, OTPs, and transaction references.
**Learning:** `Math.random()` is not cryptographically secure and can lead to predictable values, which is critical in banking applications. Biased array shuffles like `.sort(() => Math.random() - 0.5)` also introduce predictability.
**Prevention:** Always use the Node.js `crypto` module (`crypto.randomInt`, `crypto.randomBytes`) for any security-sensitive random values. Implement the Fisher-Yates shuffle algorithm with `crypto.randomInt` for secure array shuffling.
