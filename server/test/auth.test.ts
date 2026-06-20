import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/auth/password.js';
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
