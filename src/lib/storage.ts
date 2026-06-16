import {
  CURRENT_SCHEMA_VERSION,
  PersistedStateSchema,
  defaultState,
  type PersistedState,
} from '@/types/schemas';

/** The single localStorage key everything lives under. */
export const STORAGE_KEY = 'forge-data';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Returns a working Storage, or null if the environment has none. */
function defaultStorage(): StorageLike | null {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Accessing localStorage can throw (privacy mode, sandboxed iframe).
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/* ------------------------------------------------------------------ */
/* Migrations                                                          */
/* ------------------------------------------------------------------ */

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * Keyed by the version being migrated FROM. Version 0 is any legacy save that
 * predates `schemaVersion` (e.g. the original prototype's `DEFAULT_DATA`).
 */
const migrations: Record<number, Migration> = {
  0: (data) => ({ ...data, schemaVersion: 1 }),
};

function readVersion(data: Record<string, unknown>): number {
  const v = data.schemaVersion;
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/**
 * Brings a loosely-typed save up to the current schema version by chaining
 * migrations. Unknown/garbage input yields a default state. Never throws.
 */
export function migrate(input: unknown): Record<string, unknown> {
  if (!isRecord(input)) return defaultState();
  let data: Record<string, unknown> = { ...input };
  let version = readVersion(data);
  // Guard against missing migrations or accidental loops.
  while (version < CURRENT_SCHEMA_VERSION) {
    const step = migrations[version];
    if (!step) break;
    data = step(data);
    const next = readVersion(data);
    if (next <= version) break;
    version = next;
  }
  return data;
}

/* ------------------------------------------------------------------ */
/* Load / save                                                        */
/* ------------------------------------------------------------------ */

/**
 * Loads and validates the persisted state. Missing, corrupt, or out-of-date
 * data is migrated or falls back to safe defaults — this never throws and
 * never returns anything but a fully-valid `PersistedState`.
 */
export function loadState(storage: StorageLike | null = defaultStorage()): PersistedState {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw == null) return defaultState();
    const parsed: unknown = JSON.parse(raw);
    const migrated = migrate(parsed);
    return PersistedStateSchema.parse(migrated);
  } catch {
    return defaultState();
  }
}

/**
 * Persists state as JSON. Returns false (rather than throwing) if storage is
 * unavailable or full, so a failed save can never crash the app.
 */
export function saveState(
  state: PersistedState,
  storage: StorageLike | null = defaultStorage(),
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** Clears the saved state. Returns false instead of throwing on failure. */
export function clearState(storage: StorageLike | null = defaultStorage()): boolean {
  try {
    if (!storage) return false;
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Backup import / export                                             */
/* ------------------------------------------------------------------ */

/** Serialises the full state to a pretty JSON string for the user to keep. */
export function exportBackup(state: PersistedState): string {
  return JSON.stringify(state, null, 2);
}

export type ImportResult = { ok: true; state: PersistedState } | { ok: false; error: string };

/**
 * Validates a user-supplied backup file. Mirrors the prototype's sanity check
 * (it must at least look like FORGE data), then migrates + validates it.
 */
export function importBackup(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  if (!isRecord(parsed) || !('profile' in parsed || 'settings' in parsed)) {
    return { ok: false, error: "That file didn't look like a FORGE backup." };
  }
  // The schema's per-field + top-level `.catch` coerce anything FORGE-shaped
  // into a valid state, so once it parses as JSON and looks like a backup it
  // always loads — malformed fields just fall back to safe defaults.
  const state = PersistedStateSchema.parse(migrate(parsed));
  return { ok: true, state };
}
