import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';
import { memoryRepos } from '../src/repo/memory.js';
import type { Config } from '../src/config.js';
import type { FastifyInstance } from 'fastify';

const config: Config = {
  port: 0,
  jwtSecret: 'test-secret-test-secret-test-secret-0001',
  jwtTtl: 3600,
  databaseUrl: '',
  corsOrigins: ['*'],
  bcryptRounds: 6,
  isProd: false,
};

function makeApp(): FastifyInstance {
  const { users, state } = memoryRepos();
  return buildApp({ config, users, state });
}

const json = (raw: string): unknown => JSON.parse(raw);

async function register(app: FastifyInstance, email = 'a@b.com', password = 'password123') {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email, password },
  });
  return { res, body: json(res.body) as { token: string; user: { id: string; email: string } } };
}

describe('health', () => {
  it('reports ok', async () => {
    const app = makeApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect((json(res.body) as { ok: boolean }).ok).toBe(true);
  });
});

describe('auth', () => {
  let app: FastifyInstance;
  beforeEach(() => {
    app = makeApp();
  });

  it('registers a user and returns a token', async () => {
    const { res, body } = await register(app);
    expect(res.statusCode).toBe(201);
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe('a@b.com');
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a weak password and an invalid email', async () => {
    const weak = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'a@b.com', password: 'short' },
    });
    expect(weak.statusCode).toBe(400);
    const bad = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'nope', password: 'password123' },
    });
    expect(bad.statusCode).toBe(400);
  });

  it('rejects a duplicate email with 409', async () => {
    await register(app);
    const { res } = await register(app);
    expect(res.statusCode).toBe(409);
  });

  it('logs in with correct credentials and rejects wrong ones', async () => {
    await register(app, 'c@d.com', 'password123');
    const ok = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'c@d.com', password: 'password123' },
    });
    expect(ok.statusCode).toBe(200);
    expect((json(ok.body) as { token: string }).token).toBeTruthy();

    const wrong = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'c@d.com', password: 'nope' },
    });
    expect(wrong.statusCode).toBe(401);
    const missing = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ghost@d.com', password: 'password123' },
    });
    expect(missing.statusCode).toBe(401);
  });

  it('returns the current user for a valid token and 401 otherwise', async () => {
    const { body } = await register(app);
    const me = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${body.token}` },
    });
    expect(me.statusCode).toBe(200);
    expect((json(me.body) as { user: { email: string } }).user.email).toBe('a@b.com');

    expect((await app.inject({ method: 'GET', url: '/auth/me' })).statusCode).toBe(401);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: '/auth/me',
          headers: { authorization: 'Bearer nope' },
        })
      ).statusCode,
    ).toBe(401);
  });
});

describe('sync', () => {
  let app: FastifyInstance;
  let token: string;
  beforeEach(async () => {
    app = makeApp();
    token = (await register(app)).body.token;
  });
  const auth = () => ({ authorization: `Bearer ${token}` });

  it('requires authentication', async () => {
    expect((await app.inject({ method: 'GET', url: '/sync' })).statusCode).toBe(401);
    expect(
      (await app.inject({ method: 'PUT', url: '/sync', payload: { data: {}, baseRev: 0 } }))
        .statusCode,
    ).toBe(401);
  });

  it('starts empty, then pushes and pulls the state with an incrementing rev', async () => {
    const empty = await app.inject({ method: 'GET', url: '/sync', headers: auth() });
    expect(json(empty.body)).toEqual({ data: null, rev: 0, updatedAt: null });

    const put = await app.inject({
      method: 'PUT',
      url: '/sync',
      headers: auth(),
      payload: { data: { planId: 'ppl' }, baseRev: 0 },
    });
    expect(put.statusCode).toBe(200);
    expect((json(put.body) as { rev: number }).rev).toBe(1);

    const pulled = await app.inject({ method: 'GET', url: '/sync', headers: auth() });
    const snap = json(pulled.body) as { data: { planId: string }; rev: number };
    expect(snap.data.planId).toBe('ppl');
    expect(snap.rev).toBe(1);
  });

  it('returns 409 with the server state on a stale push (optimistic concurrency)', async () => {
    await app.inject({
      method: 'PUT',
      url: '/sync',
      headers: auth(),
      payload: { data: { a: 1 }, baseRev: 0 },
    });
    // Client still thinks rev is 0 → conflict.
    const stale = await app.inject({
      method: 'PUT',
      url: '/sync',
      headers: auth(),
      payload: { data: { a: 2 }, baseRev: 0 },
    });
    expect(stale.statusCode).toBe(409);
    const server = (json(stale.body) as { server: { rev: number; data: { a: number } } }).server;
    expect(server.rev).toBe(1);
    expect(server.data.a).toBe(1);
  });

  it('keeps each user’s state isolated', async () => {
    await app.inject({
      method: 'PUT',
      url: '/sync',
      headers: auth(),
      payload: { data: { who: 'A' }, baseRev: 0 },
    });
    const other = (await register(app, 'other@b.com')).body.token;
    const got = await app.inject({
      method: 'GET',
      url: '/sync',
      headers: { authorization: `Bearer ${other}` },
    });
    expect(json(got.body)).toEqual({ data: null, rev: 0, updatedAt: null });
  });
});
