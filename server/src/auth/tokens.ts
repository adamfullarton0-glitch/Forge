import jwt from 'jsonwebtoken';

export interface TokenPayload {
  /** User id (JWT subject). */
  sub: string;
}

/** Signs a short JWT carrying the user id. */
export function signToken(userId: string, secret: string, ttlSeconds: number): string {
  return jwt.sign({ sub: userId }, secret, { expiresIn: ttlSeconds });
}

/**
 * Verifies a JWT and returns its payload, or null if invalid/expired. Never
 * throws — callers treat null as "unauthenticated".
 */
export function verifyToken(token: string, secret: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'object' && decoded !== null && typeof decoded.sub === 'string') {
      return { sub: decoded.sub };
    }
    return null;
  } catch {
    return null;
  }
}

/** Pulls a bearer token out of an Authorization header, or null. */
export function bearer(header: string | undefined): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m ? (m[1] ?? null) : null;
}
