import { createHash, randomBytes } from "crypto";

/**
 * Generate a new API key
 * Format: lp_{32 random hex characters}
 * Example: lp_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 */
export function generateApiKey(): string {
  const randomPart = randomBytes(16).toString("hex");
  return `lp_${randomPart}`;
}

/**
 * Hash an API key using SHA-256
 * This is secure for API keys (not passwords, which need bcrypt)
 */
export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Verify an API key against a hash
 */
export function verifyApiKey(apiKey: string, hash: string): boolean {
  const computedHash = hashApiKey(apiKey);
  // Use constant-time comparison to prevent timing attacks
  return constantTimeEqual(computedHash, hash);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
