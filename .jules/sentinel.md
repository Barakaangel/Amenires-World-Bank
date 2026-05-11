## 2025-03-01 - Insecure Randomness in Security-Sensitive Logic
**Vulnerability:** The application was using `Math.random()` for generating passwords, SMS OTPs, and sensitive bank identifiers like routing numbers and IBANs.
**Learning:** `Math.random()` in Node.js is a non-cryptographically secure pseudo-random number generator (PRNG). This makes generated values potentially predictable, which is a high-risk vulnerability for authentication secrets and financial identifiers.
**Prevention:** Never use `Math.random()` for security-sensitive logic. Always use the Node.js `crypto` module, specifically `crypto.randomInt()` for integers and `crypto.randomBytes()` for tokens. For shuffling arrays (like in password generation), implement the Fisher-Yates algorithm using secure randomness.
