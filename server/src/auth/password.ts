import bcrypt from 'bcryptjs';

/** Hashes a plaintext password with bcrypt. */
export function hashPassword(plain: string, rounds = 10): Promise<string> {
  return bcrypt.hash(plain, rounds);
}

/** Constant-time compare of a plaintext password against a stored hash. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash).catch(() => false);
}

/**
 * A genuine bcrypt hash (of throwaway input) at the given cost, used as the
 * comparison target when no account exists — so a login against an unknown
 * email takes the same time as one against a real account (no enumeration via
 * timing). Computed once at startup; the cost must match real accounts.
 */
export function dummyHash(rounds = 10): string {
  return bcrypt.hashSync('forge-no-such-account', rounds);
}
