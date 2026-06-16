import { create } from 'zustand';
import { loadState, saveState, clearState } from '@/lib/storage';
import { defaultState, type PersistedState } from '@/types/schemas';

interface ForgeStore {
  data: PersistedState;
  /** Shallow-merge a patch into state and persist (mirrors the prototype's `up`). */
  update: (patch: Partial<PersistedState>) => void;
  /** Wipe saved data and return to a fresh default state. */
  reset: () => void;
}

export const useStore = create<ForgeStore>((set, get) => ({
  // Validated load — corrupt/old/missing data falls back to safe defaults.
  data: loadState(),
  update: (patch) => {
    set((s) => ({ data: { ...s.data, ...patch } }));
    saveState(get().data);
  },
  reset: () => {
    clearState();
    set({ data: defaultState() });
  },
}));

/* ---- Selectors / hooks (stable references, minimal re-renders) ---- */

export const useData = (): PersistedState => useStore((s) => s.data);
export const useUpdate = (): ForgeStore['update'] => useStore((s) => s.update);
export const useReset = (): ForgeStore['reset'] => useStore((s) => s.reset);
