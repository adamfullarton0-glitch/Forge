import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  STORAGE_KEY,
  PHOTOS_KEY,
  loadState,
  saveState,
  clearState,
  loadPhotos,
  savePhotos,
  migrate,
  exportBackup,
  importBackup,
} from './storage';
import { CURRENT_SCHEMA_VERSION, defaultState, type ProgressPhoto } from '@/types/schemas';

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** An in-memory localStorage stand-in. */
function fakeStorage(initial?: Record<string, string>): Store & { map: Map<string, string> } {
  const map = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

/** A storage that throws on every access (privacy mode, quota exceeded). */
const throwingStorage: Store = {
  getItem() {
    throw new Error('blocked');
  },
  setItem() {
    throw new Error('quota');
  },
  removeItem() {
    throw new Error('blocked');
  },
};

const withState = (value: unknown) => fakeStorage({ [STORAGE_KEY]: JSON.stringify(value) });

describe('defaultState', () => {
  it('is internally valid and carries the current schema version', () => {
    const d = defaultState();
    expect(d.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(d.profile).toBeNull();
    expect(d.gear).toContain('barbell');
    // Loading the defaults back through the schema must be a no-op.
    expect(loadState(withState(d))).toEqual(d);
  });
});

describe('loadState', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadState(fakeStorage())).toEqual(defaultState());
  });

  it('round-trips a valid saved state', () => {
    const state = { ...defaultState(), pro: true, planId: 'ul' };
    const loaded = loadState(withState(state));
    expect(loaded.pro).toBe(true);
    expect(loaded.planId).toBe('ul');
  });

  it('falls back to defaults on corrupt JSON', () => {
    const store = fakeStorage({ [STORAGE_KEY]: '{not valid json' });
    expect(loadState(store)).toEqual(defaultState());
  });

  it('falls back to defaults for non-object JSON (null, array, string, number)', () => {
    for (const garbage of ['null', '[]', '"hello"', '42']) {
      const store = fakeStorage({ [STORAGE_KEY]: garbage });
      expect(loadState(store)).toEqual(defaultState());
    }
  });

  it('never throws even when storage access itself throws', () => {
    expect(() => loadState(throwingStorage)).not.toThrow();
    expect(loadState(throwingStorage)).toEqual(defaultState());
  });

  it('returns defaults when there is no storage at all', () => {
    expect(loadState(null)).toEqual(defaultState());
  });
});

describe('ambient localStorage (default storage)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.localStorage?.clear();
  });

  it('reads and writes through the ambient localStorage when no store is passed', () => {
    const state = { ...defaultState(), pro: true };
    expect(saveState(state)).toBe(true);
    expect(loadState().pro).toBe(true);
    expect(clearState()).toBe(true);
    expect(loadState()).toEqual(defaultState());
  });

  it('degrades gracefully when no ambient localStorage exists', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(loadState()).toEqual(defaultState());
    expect(saveState(defaultState())).toBe(false);
    expect(clearState()).toBe(false);
  });
});

describe('schema resilience (malformed fields fall back, never crash)', () => {
  it('salvages valid fields and defaults the corrupt ones', () => {
    const loaded = loadState(
      withState({
        schemaVersion: 1,
        pro: 'yes please', // wrong type -> false
        weights: 'not an array', // -> []
        planId: 42, // -> 'ppl'
        settings: { dark: 'no', accent: 'banana', lang: 'martian' }, // -> safe defaults
        devices: ['Garmin'], // valid, kept
      }),
    );
    expect(loaded.pro).toBe(false);
    expect(loaded.weights).toEqual([]);
    expect(loaded.planId).toBe('ppl');
    expect(loaded.settings).toEqual({ dark: true, accent: 'pulse', lang: 'en' });
    expect(loaded.devices).toEqual(['Garmin']); // the one good field survives
  });

  it('keeps NaN/Infinity out of numeric profile fields', () => {
    const loaded = loadState(
      withState({
        schemaVersion: 1,
        profile: {
          name: 'Sam',
          sex: 'f',
          age: 'old', // -> 25
          height: 180,
          weight: Number.POSITIVE_INFINITY, // serialises to null -> fallback
          targetWeight: 70,
          weightUnit: 'kg',
          heightUnit: 'cm',
          goal: 'lose',
          activity: 'high',
          experience: 'advanced',
          allergies: [],
          dislikes: [],
        },
      }),
    );
    expect(loaded.profile?.name).toBe('Sam');
    expect(loaded.profile?.age).toBe(25);
    expect(Number.isFinite(loaded.profile?.weight ?? NaN)).toBe(true);
  });

  it('drops a corrupt day of the food log without losing the rest', () => {
    const loaded = loadState(
      withState({
        schemaVersion: 1,
        foodLog: {
          '2026-06-16': [{ meal: 'lunch', name: 'Rice', kcal: 260, p: 5, c: 56, f: 1 }],
          '2026-06-17': 'corrupted',
        },
      }),
    );
    expect(loaded.foodLog['2026-06-16']).toHaveLength(1);
    expect(loaded.foodLog['2026-06-17']).toEqual([]);
  });
});

describe('migrations', () => {
  it('upgrades a legacy save with no schemaVersion to the current version', () => {
    const legacy = {
      profile: null,
      settings: { dark: true, accent: 'pulse', lang: 'en' },
      planId: 'ppl',
      pro: false,
    };
    const migrated = migrate(legacy);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('loads a legacy prototype save end-to-end without crashing', () => {
    // Shape taken straight from the prototype's DEFAULT_DATA (no schemaVersion).
    const legacy = {
      profile: {
        name: 'Alex',
        sex: 'm',
        age: 24,
        height: 178,
        weight: 80,
        targetWeight: 75,
        weightUnit: 'kg',
        heightUnit: 'cm',
        goal: 'lose',
        activity: 'moderate',
        experience: 'beginner',
        allergies: ['Dairy'],
        dislikes: ['olives'],
      },
      settings: { dark: true, accent: 'pulse', lang: 'en' },
      planId: 'ppl',
      schedule: { 0: { day: '0', time: '18:00' } },
      remind: { on: true, lead: 30 },
      foodLog: {},
      water: {},
      weights: [{ d: '2026-06-15', w: 80 }],
      done: [],
      active: null,
      pro: false,
      sleep: {},
      devices: [],
      measure: {},
      gear: ['barbell', 'dumbbell'],
      lifts: { 'Barbell Bench Press': [{ d: '2026-06-15', w: 60, reps: 8, e1rm: 76, hit: true }] },
    };
    const loaded = loadState(withState(legacy));
    expect(loaded.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(loaded.profile?.name).toBe('Alex');
    expect(loaded.weights).toHaveLength(1);
    expect(loaded.lifts['Barbell Bench Press']).toHaveLength(1);
  });

  it('leaves an already-current save unchanged', () => {
    const current = { ...defaultState() } as unknown as Record<string, unknown>;
    expect(migrate(current).schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('returns a default state for non-object input', () => {
    expect(migrate('nope').schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrate(null).profile).toBeNull();
    expect(migrate([1, 2, 3]).schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});

describe('saveState / clearState', () => {
  it('persists and reloads a state', () => {
    const store = fakeStorage();
    const state = { ...defaultState(), pro: true };
    expect(saveState(state, store)).toBe(true);
    expect(loadState(store)).toEqual(state);
  });

  it('returns false instead of throwing when storage is unavailable or full', () => {
    expect(saveState(defaultState(), null)).toBe(false);
    expect(saveState(defaultState(), throwingStorage)).toBe(false);
  });

  it('clears stored state', () => {
    const store = fakeStorage({ [STORAGE_KEY]: JSON.stringify(defaultState()) });
    expect(clearState(store)).toBe(true);
    expect(store.map.has(STORAGE_KEY)).toBe(false);
    expect(loadState(store)).toEqual(defaultState());
  });

  it('clearState returns false on unavailable/throwing storage', () => {
    expect(clearState(null)).toBe(false);
    expect(clearState(throwingStorage)).toBe(false);
  });
});

describe('backup import / export', () => {
  it('round-trips through export then import', () => {
    const state = { ...defaultState(), pro: true, planId: 'arnold' };
    const result = importBackup(exportBackup(state));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.pro).toBe(true);
      expect(result.state.planId).toBe('arnold');
    }
  });

  it('rejects invalid JSON', () => {
    const result = importBackup('{broken');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('JSON');
  });

  it("rejects files that don't look like a FORGE backup", () => {
    expect(importBackup('{"foo":1}').ok).toBe(false);
    expect(importBackup('[]').ok).toBe(false);
    expect(importBackup('"text"').ok).toBe(false);
  });

  it('accepts a minimal but FORGE-shaped backup and fills defaults', () => {
    const result = importBackup('{"settings":{"dark":false,"accent":"violet","lang":"es"}}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.settings).toEqual({ dark: false, accent: 'violet', lang: 'es' });
      expect(result.state.gear).toContain('barbell'); // default filled in
    }
  });

  it('migrates a legacy backup on import', () => {
    const result = importBackup(JSON.stringify({ profile: null, settings: {}, planId: 'fb' }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(result.state.planId).toBe('fb');
    }
  });
});

describe('progress photos (separate storage key)', () => {
  const photo = (id: string): ProgressPhoto => ({ id, d: '2026-06-16', src: `data:,${id}` });

  it('persists and reloads photos under their own key', () => {
    const store = fakeStorage();
    expect(savePhotos([photo('a'), photo('b')], store)).toBe(true);
    expect(store.map.has(PHOTOS_KEY)).toBe(true);
    expect(loadPhotos(store).map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('returns [] for missing or corrupt photo data, never throwing', () => {
    expect(loadPhotos(fakeStorage())).toEqual([]);
    expect(loadPhotos(fakeStorage({ [PHOTOS_KEY]: '{not json' }))).toEqual([]);
    expect(loadPhotos(fakeStorage({ [PHOTOS_KEY]: '"text"' }))).toEqual([]);
    expect(() => loadPhotos(throwingStorage)).not.toThrow();
    expect(loadPhotos(null)).toEqual([]);
  });

  it('drops a corrupt photo entry but keeps the valid ones', () => {
    const store = fakeStorage({
      [PHOTOS_KEY]: JSON.stringify([photo('good'), 'garbage', { id: 7 }]),
    });
    const loaded = loadPhotos(store);
    expect(loaded.some((p) => p.id === 'good')).toBe(true);
  });

  it('savePhotos returns false (not throw) when storage is full/unavailable', () => {
    expect(savePhotos([photo('a')], null)).toBe(false);
    expect(savePhotos([photo('a')], throwingStorage)).toBe(false);
  });

  it('a full photos key never corrupts or blocks the main state blob', () => {
    // A store that only rejects writes to the PHOTOS key (simulating photos
    // hitting quota) must still let the main state save succeed.
    const map = new Map<string, string>();
    const store: Store = {
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => {
        if (k === PHOTOS_KEY) throw new Error('quota');
        map.set(k, v);
      },
      removeItem: (k) => void map.delete(k),
    };
    expect(savePhotos([photo('big')], store)).toBe(false); // photo save fails
    expect(saveState({ ...defaultState(), pro: true }, store)).toBe(true); // state still saves
    expect(loadState(store).pro).toBe(true);
  });

  it('clearState removes the photos key too', () => {
    const store = fakeStorage({
      [STORAGE_KEY]: JSON.stringify(defaultState()),
      [PHOTOS_KEY]: JSON.stringify([photo('a')]),
    });
    expect(clearState(store)).toBe(true);
    expect(store.map.has(PHOTOS_KEY)).toBe(false);
    expect(loadPhotos(store)).toEqual([]);
  });
});
