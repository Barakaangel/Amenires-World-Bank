## 2025-05-15 - Insecure Randomness in Security Logic
**Vulnerability:** Use of `Math.random()` for generating "secure" passwords and shuffling them.
**Learning:** `Math.random()` in JavaScript is not cryptographically secure (it is a PRNG, not a CSPRNG). Using it for security-sensitive logic like password generation or session tokens makes the output predictable to an attacker who can observe or guess the seed. Additionally, using `.sort(() => Math.random() - 0.5)` for shuffling is biased and doesn't provide a uniform distribution.
**Prevention:** Always use the Node.js `crypto` module (e.g., `crypto.randomInt`, `crypto.randomBytes`) for any security-related randomness. Implement the Fisher-Yates shuffle algorithm with a CSPRNG for unbiased shuffling.
