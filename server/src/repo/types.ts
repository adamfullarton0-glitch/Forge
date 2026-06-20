/**
 * Persistence contracts. Routes depend only on these interfaces, so the API can
 * run against Postgres in production and an in-memory store in tests — no
 * database needed to exercise the full request/response logic.
 */

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Snapshot {
  /** The full app state blob (opaque to the server). */
  data: unknown;
  /** Monotonic revision for optimistic concurrency. */
  rev: number;
  updatedAt: string;
}

export interface UserRepo {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  /** Create a user. Rejects (CONFLICT) if the email already exists. */
  create(email: string, passwordHash: string): Promise<User>;
}

export interface StateRepo {
  /** The user's latest snapshot, or null if they've never synced. */
  get(userId: string): Promise<Snapshot | null>;
  /**
   * Replace the user's snapshot. `baseRev` is the revision the client started
   * from; if it no longer matches the stored rev, returns `{ conflict: true }`
   * with the current snapshot so the client can merge and retry.
   */
  put(
    userId: string,
    data: unknown,
    baseRev: number,
  ): Promise<{ conflict: false; snapshot: Snapshot } | { conflict: true; snapshot: Snapshot }>;
}

/** Thrown by repos when a unique constraint (email) is violated. */
export class ConflictError extends Error {
  constructor(message = 'Already exists') {
    super(message);
    this.name = 'ConflictError';
  }
}
