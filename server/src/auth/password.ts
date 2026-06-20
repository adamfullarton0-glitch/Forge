import bcrypt from 'bcryptjs';

/** Hashes a plaintext password with bcrypt. */
export function hashPassword(plain: string, rounds = 10): Promise<string> {
  return bcrypt.hash(plain, rounds);
}

/** Constant-time compare of a plaintext password against a stored hash. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash).catch(() => false);
}
