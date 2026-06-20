import { randomUUID } from 'node:crypto';
import { ConflictError, type Snapshot, type StateRepo, type User, type UserRepo } from './types.js';

/** In-memory repositories for tests + local dev without a database. */
export function memoryRepos(): { users: UserRepo; state: StateRepo } {
  const usersById = new Map<string, User>();
  const usersByEmail = new Map<string, User>();
  const snapshots = new Map<string, Snapshot>();

  const users: UserRepo = {
    findByEmail: (email) => Promise.resolve(usersByEmail.get(email.toLowerCase()) ?? null),
    findById: (id) => Promise.resolve(usersById.get(id) ?? null),
    create: (email, passwordHash) => {
      const key = email.toLowerCase();
      if (usersByEmail.has(key))
        return Promise.reject(new ConflictError('Email already registered'));
      const user: User = {
        id: randomUUID(),
        email: key,
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      usersById.set(user.id, user);
      usersByEmail.set(key, user);
      return Promise.resolve(user);
    },
  };

  const state: StateRepo = {
    get: (userId) => Promise.resolve(snapshots.get(userId) ?? null),
    put: (userId, data, baseRev) => {
      const current = snapshots.get(userId);
      const currentRev = current?.rev ?? 0;
      if (baseRev !== currentRev) {
        return Promise.resolve({
          conflict: true as const,
          snapshot: current ?? { data: null, rev: 0, updatedAt: new Date(0).toISOString() },
        });
      }
      const snapshot: Snapshot = {
        data,
        rev: currentRev + 1,
        updatedAt: new Date().toISOString(),
      };
      snapshots.set(userId, snapshot);
      return Promise.resolve({ conflict: false as const, snapshot });
    },
  };

  return { users, state };
}
