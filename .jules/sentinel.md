## 2025-05-13 - [Insecure Randomness for Security Tokens and References]
**Vulnerability:** Use of `Math.random()` for generating secure passwords, SMS OTPs, and transaction references.
**Learning:** `Math.random()` in Node.js is not cryptographically secure and its output can be predictable, making it unsuitable for security-sensitive operations like password generation, MFA tokens, or unique identifiers that must be unguessable.
**Prevention:** Always use the `crypto` module, specifically `crypto.randomInt()` or `crypto.randomBytes()`, for any security-related random values. For shuffling, implement a Fisher-Yates shuffle using a secure random source.
