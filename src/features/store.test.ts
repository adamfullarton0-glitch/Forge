import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useStore } from './store';
import { defaultState } from '@/types/schemas';
import { STORAGE_KEY, loadState } from '@/lib/storage';

describe('forge store', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState({ data: defaultState() });
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

  it('reset clears storage and returns to defaults', () => {
    useStore.getState().update({ pro: true });
    useStore.getState().reset();
    expect(useStore.getState().data.pro).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
