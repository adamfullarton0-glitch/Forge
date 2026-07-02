import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { ConflictError, type StateRepo, type User, type UserRepo } from './types.js';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}
interface SnapRow {
  data: unknown;
  rev: number;
  updated_at: Date;
}

const toUser = (r: UserRow): User => ({
  id: r.id,
  email: r.email,
  passwordHash: r.password_hash,
  createdAt: r.created_at.toISOString(),
});

/** Postgres-backed repositories (raw SQL — no ORM/codegen). */
export function pgRepos(pool: Pool): { users: UserRepo; state: StateRepo } {
  const users: UserRepo = {
    async findByEmail(email) {
      const { rows } = await pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [
        email.toLowerCase(),
      ]);
      return rows[0] ? toUser(rows[0]) : null;
    },
    async findById(id) {
      const { rows } = await pool.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
      return rows[0] ? toUser(rows[0]) : null;
    },
    async create(email, passwordHash) {
      const id = randomUUID();
      try {
        const { rows } = await pool.query<UserRow>(
          'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
          [id, email.toLowerCase(), passwordHash],
        );
        return toUser(rows[0]!);
      } catch (err) {
        // 23505 = unique_violation
        if (err && typeof err === 'object' && (err as { code?: string }).code === '23505') {
          throw new ConflictError('Email already registered');
        }
        throw err;
      }
    },
  };

  const state: StateRepo = {
    async get(userId) {
      const { rows } = await pool.query<SnapRow>(
        'SELECT data, rev, updated_at FROM snapshots WHERE user_id = $1',
        [userId],
      );
      const r = rows[0];
      return r ? { data: r.data, rev: r.rev, updatedAt: r.updated_at.toISOString() } : null;
    },
    async put(userId, data, baseRev) {
      // Atomic optimistic concurrency that exactly mirrors the in-memory repo:
      //  - update when a row exists AND its rev == baseRev;
      //  - insert (rev 1) only when no row exists AND baseRev == 0;
      //  - otherwise write nothing → caller returns conflict + current state.
      // Both branches run in one statement (one DB snapshot); the insert's
      // ON CONFLICT DO NOTHING makes a concurrent first-write race safe.
      const json = JSON.stringify(data);
      const { rows } = await pool.query<SnapRow>(
        `WITH upd AS (
           UPDATE snapshots SET data = $2::jsonb, rev = rev + 1, updated_at = now()
           WHERE user_id = $1 AND rev = $3
           RETURNING data, rev, updated_at
         ),
         ins AS (
           INSERT INTO snapshots (user_id, data, rev, updated_at)
           SELECT $1, $2::jsonb, 1, now()
           WHERE $3 = 0 AND NOT EXISTS (SELECT 1 FROM snapshots WHERE user_id = $1)
           ON CONFLICT (user_id) DO NOTHING
           RETURNING data, rev, updated_at
         )
         SELECT data, rev, updated_at FROM upd
         UNION ALL
         SELECT data, rev, updated_at FROM ins`,
        [userId, json, baseRev],
      );
      const updated = rows[0];
      if (updated) {
        return {
          conflict: false as const,
          snapshot: {
            data: updated.data,
            rev: updated.rev,
            updatedAt: updated.updated_at.toISOString(),
          },
        };
      }
      // No row written → either a rev mismatch, or first insert lost a race.
      const current = await this.get(userId);
      return {
        conflict: true as const,
        snapshot: current ?? { data: null, rev: 0, updatedAt: new Date(0).toISOString() },
      };
    },
  };

  return { users, state };
}
