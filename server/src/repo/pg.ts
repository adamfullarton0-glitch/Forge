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
      // Atomic optimistic-concurrency upsert: only writes when the stored rev
      // matches baseRev (or the row doesn't exist yet and baseRev is 0).
      const json = JSON.stringify(data);
      const { rows } = await pool.query<SnapRow>(
        `INSERT INTO snapshots (user_id, data, rev, updated_at)
           VALUES ($1, $2::jsonb, 1, now())
         ON CONFLICT (user_id) DO UPDATE
           SET data = EXCLUDED.data, rev = snapshots.rev + 1, updated_at = now()
           WHERE snapshots.rev = $3
         RETURNING data, rev, updated_at`,
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
