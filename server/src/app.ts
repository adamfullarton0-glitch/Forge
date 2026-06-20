import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { Config } from './config.js';
import type { StateRepo, UserRepo } from './repo/types.js';
import { ConflictError } from './repo/types.js';
import { hashPassword, verifyPassword } from './auth/password.js';
import { signToken, verifyToken, bearer } from './auth/tokens.js';
import { CredentialsSchema, LoginSchema, SyncPutSchema } from './schemas.js';

export interface Deps {
  config: Config;
  users: UserRepo;
  state: StateRepo;
}

/** Max accepted body size for a sync push (base64 photos live elsewhere). */
const BODY_LIMIT = 2 * 1024 * 1024; // 2 MB

const publicUser = (u: { id: string; email: string; createdAt: string }) => ({
  id: u.id,
  email: u.email,
  createdAt: u.createdAt,
});

/**
 * Builds the Fastify app with its dependencies injected, so tests can pass
 * in-memory repos and exercise every route with `app.inject()` — no network,
 * no database.
 */
export function buildApp({ config, users, state }: Deps): FastifyInstance {
  const app = Fastify({ logger: config.isProd, bodyLimit: BODY_LIMIT });

  void app.register(helmet, { contentSecurityPolicy: false });
  void app.register(cors, {
    origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
    methods: ['GET', 'PUT', 'POST', 'OPTIONS'],
  });
  void app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  /** Resolves the authenticated user id from the Authorization header, or replies 401. */
  const requireUserId = (req: FastifyRequest, reply: FastifyReply): string | null => {
    const token = bearer(req.headers.authorization);
    const payload = token ? verifyToken(token, config.jwtSecret) : null;
    if (!payload) {
      void reply.code(401).send({ error: 'Unauthorized' });
      return null;
    }
    return payload.sub;
  };

  app.get('/health', () => ({ ok: true, name: 'forge-server', version: '0.1.0' }));

  app.post('/auth/register', async (req, reply) => {
    const parsed = CredentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }
    const { email, password } = parsed.data;
    try {
      const hash = await hashPassword(password, config.bcryptRounds);
      const user = await users.create(email, hash);
      const token = signToken(user.id, config.jwtSecret, config.jwtTtl);
      return reply.code(201).send({ token, user: publicUser(user) });
    } catch (err) {
      if (err instanceof ConflictError) {
        return reply.code(409).send({ error: 'That email is already registered.' });
      }
      throw err;
    }
  });

  app.post('/auth/login', async (req, reply) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(401).send({ error: 'Invalid email or password.' });
    }
    const { email, password } = parsed.data;
    const user = await users.findByEmail(email);
    // Always run a hash compare to avoid leaking which emails exist (timing).
    const ok = user
      ? await verifyPassword(password, user.passwordHash)
      : await verifyPassword(
          password,
          '$2a$10$0000000000000000000000000000000000000000000000000000',
        );
    if (!user || !ok) {
      return reply.code(401).send({ error: 'Invalid email or password.' });
    }
    const token = signToken(user.id, config.jwtSecret, config.jwtTtl);
    return reply.send({ token, user: publicUser(user) });
  });

  app.get('/auth/me', async (req, reply) => {
    const userId = requireUserId(req, reply);
    if (!userId) return;
    const user = await users.findById(userId);
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });
    return reply.send({ user: publicUser(user) });
  });

  app.get('/sync', async (req, reply) => {
    const userId = requireUserId(req, reply);
    if (!userId) return;
    const snap = await state.get(userId);
    return reply.send(snap ?? { data: null, rev: 0, updatedAt: null });
  });

  app.put('/sync', async (req, reply) => {
    const userId = requireUserId(req, reply);
    if (!userId) return;
    const parsed = SyncPutSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid sync payload.' });
    const result = await state.put(userId, parsed.data.data, parsed.data.baseRev);
    if (result.conflict) {
      // The client is behind — return the server's current state to merge.
      return reply.code(409).send({ error: 'conflict', server: result.snapshot });
    }
    return reply.send({ rev: result.snapshot.rev, updatedAt: result.snapshot.updatedAt });
  });

  return app;
}
