import { create } from 'zustand';
import { loadState, saveState, clearState, loadPhotos, savePhotos } from '@/lib/storage';
import { defaultState, type PersistedState, type ProgressPhoto } from '@/types/schemas';

interface ForgeStore {
  data: PersistedState;
  /** Progress photos — persisted under their own storage key (see storage.ts). */
  photos: ProgressPhoto[];
  /** Shallow-merge a patch into state and persist (mirrors the prototype's `up`). */
  update: (patch: Partial<PersistedState>) => void;
  /**
   * Like `update`, but only applies the patch in memory if it persists
   * successfully. Returns whether the save succeeded — use for large writes so
   * a full or unavailable store can't leave the UI showing data that would
   * vanish on reload.
   */
  tryUpdate: (patch: Partial<PersistedState>) => boolean;
  /**
   * Replace the photo gallery, persisting to its own key. Returns whether the
   * save succeeded (false when storage is full) and only applies in memory on
   * success — so a too-large photo is never shown as saved.
   */
  setPhotos: (next: readonly ProgressPhoto[]) => boolean;
  /** Wipe saved data (state + photos) and return to a fresh default state. */
  reset: () => void;
}

export const useStore = create<ForgeStore>((set, get) => ({
  // Validated load — corrupt/old/missing data falls back to safe defaults.
  data: loadState(),
  photos: loadPhotos(),
  update: (patch) => {
    set((s) => ({ data: { ...s.data, ...patch } }));
    saveState(get().data);
  },
  tryUpdate: (patch) => {
    const next = { ...get().data, ...patch };
    const ok = saveState(next);
    if (ok) set({ data: next });
    return ok;
  },
  setPhotos: (next) => {
    const arr = [...next];
    const ok = savePhotos(arr);
    if (ok) set({ photos: arr });
    return ok;
  },
  reset: () => {
    clearState();
    set({ data: defaultState(), photos: [] });
  },
}));

/* ---- Selectors / hooks (stable references, minimal re-renders) ---- */

export const useData = (): PersistedState => useStore((s) => s.data);
export const useUpdate = (): ForgeStore['update'] => useStore((s) => s.update);
export const useTryUpdate = (): ForgeStore['tryUpdate'] => useStore((s) => s.tryUpdate);
export const usePhotos = (): ProgressPhoto[] => useStore((s) => s.photos);
export const useSetPhotos = (): ForgeStore['setPhotos'] => useStore((s) => s.setPhotos);
export const useReset = (): ForgeStore['reset'] => useStore((s) => s.reset);
