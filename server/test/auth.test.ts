import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, dummyHash } from '../src/auth/password.js';
import { signToken, verifyToken, bearer } from '../src/auth/tokens.js';

const SECRET = 'test-secret-test-secret-test-secret-0001';

describe('password hashing', () => {
  it('hashes and verifies a correct password', async () => {
    const hash = await hashPassword('correct horse battery', 8);
    expect(hash).not.toContain('correct');
    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
  });

  it('rejects a wrong password and never throws on a bad hash', async () => {
    const hash = await hashPassword('right', 8);
    expect(await verifyPassword('wrong', hash)).toBe(false);
    expect(await verifyPassword('x', 'not-a-real-hash')).toBe(false);
  });

  it('dummyHash is a real 60-char bcrypt hash (constant-time login, no enum leak)', () => {
    const h = dummyHash(8);
    // A valid bcrypt hash is exactly 60 chars; a malformed one would make the
    // compare short-circuit and leak account existence via timing.
    expect(h).toHaveLength(60);
    expect(h.startsWith('$2')).toBe(true);
  });
});

describe('jwt tokens', () => {
  it('round-trips a user id', () => {
    const token = signToken('user-123', SECRET, 60);
    expect(verifyToken(token, SECRET)).toEqual({ sub: 'user-123' });
  });

  it('rejects a token signed with a different secret, expired, or malformed', () => {
    const token = signToken('u', SECRET, 60);
    expect(verifyToken(token, 'other-secret')).toBeNull();
    expect(verifyToken('garbage.token.here', SECRET)).toBeNull();
    expect(verifyToken(signToken('u', SECRET, -1), SECRET)).toBeNull();
  });

  it('parses a bearer header', () => {
    expect(bearer('Bearer abc.def')).toBe('abc.def');
    expect(bearer('bearer abc')).toBe('abc');
    expect(bearer('Basic abc')).toBeNull();
    expect(bearer(undefined)).toBeNull();
  });
});
