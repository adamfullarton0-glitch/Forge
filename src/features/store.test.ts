import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useStore } from './store';
import { defaultState } from '@/types/schemas';
import { STORAGE_KEY, PHOTOS_KEY, loadState, loadPhotos } from '@/lib/storage';

describe('forge store', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState({ data: defaultState(), photos: [] });
  });
  afterEach(() => localStorage.clear());

  it('starts from a valid default state', () => {
    expect(useStore.getState().data.profile).toBeNull();
    expect(useStore.getState().data.planId).toBe('ppl');
  });

  it('update merges a patch and persists it', () => {
    useStore.getState().update({ pro: true });
    expect(useStore.getState().data.pro).toBe(true);
    // Persisted to the same storage loadState reads from.
    expect(loadState().pro).toBe(true);
  });

  it('update only touches the patched keys', () => {
    useStore.getState().update({ planId: 'ul' });
    expect(useStore.getState().data.planId).toBe('ul');
    expect(useStore.getState().data.pro).toBe(false);
  });

  it('reset clears storage (state + photos) and returns to defaults', () => {
    useStore.getState().update({ pro: true });
    useStore.getState().setPhotos([{ id: 'p1', d: '2026-06-16', src: 'data:,x' }]);
    useStore.getState().reset();
    expect(useStore.getState().data.pro).toBe(false);
    expect(useStore.getState().photos).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(PHOTOS_KEY)).toBeNull();
  });

  it('setPhotos persists to the photos key on success', () => {
    const ok = useStore.getState().setPhotos([{ id: 'p1', d: '2026-06-16', src: 'data:,x' }]);
    expect(ok).toBe(true);
    expect(useStore.getState().photos.map((p) => p.id)).toEqual(['p1']);
    expect(loadPhotos().map((p) => p.id)).toEqual(['p1']); // persisted separately
  });

  it('setPhotos leaves the gallery untouched when the save fails', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    try {
      const ok = useStore.getState().setPhotos([{ id: 'p1', d: '2026-06-16', src: 'data:,x' }]);
      expect(ok).toBe(false);
      expect(useStore.getState().photos).toEqual([]); // not applied in memory
    } finally {
      spy.mockRestore();
    }
  });

  it('tryUpdate applies and persists when the save succeeds', () => {
    const ok = useStore.getState().tryUpdate({ planId: 'ul' });
    expect(ok).toBe(true);
    expect(useStore.getState().data.planId).toBe('ul');
    expect(loadState().planId).toBe('ul');
  });

  it('tryUpdate leaves state untouched when the save fails', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    try {
      const ok = useStore.getState().tryUpdate({ planId: 'ul' });
      expect(ok).toBe(false);
      // Not applied in memory — would otherwise vanish on reload.
      expect(useStore.getState().data.planId).toBe('ppl');
    } finally {
      spy.mockRestore();
    }
  });
});
