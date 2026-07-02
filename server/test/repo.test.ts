import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { newDb } from 'pg-mem';
import { pgRepos } from '../src/repo/pg.js';
import { memoryRepos } from '../src/repo/memory.js';
import { ConflictError, type StateRepo, type UserRepo } from '../src/repo/types.js';

const SCHEMA = readFileSync(join(import.meta.dirname, '..', 'db', 'schema.sql'), 'utf8');

/** A fresh pg repo backed by an in-memory Postgres (real SQL, no server). */
function pgBacked(): { users: UserRepo; state: StateRepo } {
  const db = newDb();
  const { Pool } = db.adapters.createPg();
  const pool = new Pool() as unknown as import('pg').Pool;
  // pg-mem doesn't ship now()/gen_random_uuid by default for all paths; the
  // schema only needs the tables. Apply it synchronously via the raw db.
  db.public.none(SCHEMA);
  return pgRepos(pool);
}

// The same contract is asserted against BOTH backends, so they can never drift.
const backends: Array<[string, () => { users: UserRepo; state: StateRepo }]> = [
  ['memory', memoryRepos],
  ['postgres (pg-mem)', pgBacked],
];

describe.each(backends)('repo contract — %s', (_name, make) => {
  let users: UserRepo;
  let state: StateRepo;
  let userId: string;

  beforeEach(async () => {
    ({ users, state } = make());
    userId = (await users.create('a@b.com', 'hash')).id;
  });

  describe('users', () => {
    it('finds by email (case-insensitive) and id', async () => {
      expect((await users.findByEmail('A@B.COM'))?.id).toBe(userId);
      expect((await users.findById(userId))?.email).toBe('a@b.com');
      expect(await users.findByEmail('nobody@x.com')).toBeNull();
    });

    it('rejects a duplicate email with ConflictError', async () => {
      await expect(users.create('a@b.com', 'h')).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('state optimistic concurrency', () => {
    it('returns null before any write', async () => {
      expect(await state.get(userId)).toBeNull();
    });

    it('inserts the first snapshot at rev 1 when baseRev is 0', async () => {
      const r = await state.put(userId, { planId: 'ppl' }, 0);
      expect(r.conflict).toBe(false);
      expect(r.snapshot.rev).toBe(1);
      expect((await state.get(userId))?.rev).toBe(1);
    });

    it('updates when baseRev matches the stored rev', async () => {
      await state.put(userId, { a: 1 }, 0);
      const r = await state.put(userId, { a: 2 }, 1);
      expect(r.conflict).toBe(false);
      expect(r.snapshot.rev).toBe(2);
      expect((await state.get(userId))?.data).toEqual({ a: 2 });
    });

    it('conflicts (no write) on a stale baseRev, returning the current state', async () => {
      await state.put(userId, { a: 1 }, 0);
      const r = await state.put(userId, { a: 2 }, 0); // stale: stored rev is 1
      expect(r.conflict).toBe(true);
      expect(r.snapshot.rev).toBe(1);
      expect(r.snapshot.data).toEqual({ a: 1 });
      expect((await state.get(userId))?.data).toEqual({ a: 1 }); // unchanged
    });

    it('conflicts on a first write with baseRev > 0 (no row yet)', async () => {
      const r = await state.put(userId, { a: 9 }, 5);
      expect(r.conflict).toBe(true);
      expect(await state.get(userId)).toBeNull(); // nothing written
    });

    it('keeps users isolated', async () => {
      const other = (await users.create('b@c.com', 'h')).id;
      await state.put(userId, { who: 'A' }, 0);
      expect(await state.get(other)).toBeNull();
    });
  });
});
