import { describe, it, expect } from 'vitest';
import { seedNum } from './seed';

describe('seedNum', () => {
  it('is deterministic for the same seed', () => {
    expect(seedNum('2026-06-16steps', 6200, 13400)).toBe(seedNum('2026-06-16steps', 6200, 13400));
  });

  it('stays within [min, max] across many seeds', () => {
    for (let i = 0; i < 500; i++) {
      const v = seedNum(`seed-${i}`, 50, 60);
      expect(v).toBeGreaterThanOrEqual(50);
      expect(v).toBeLessThanOrEqual(60);
    }
  });

  it('returns min when min === max', () => {
    expect(seedNum('anything', 42, 42)).toBe(42);
  });

  it('tolerates a swapped range', () => {
    const v = seedNum('x', 60, 50);
    expect(v).toBeGreaterThanOrEqual(50);
    expect(v).toBeLessThanOrEqual(60);
  });

  it('produces different values for different seeds (not all identical)', () => {
    const values = new Set(Array.from({ length: 50 }, (_, i) => seedNum(`d${i}`, 0, 1000)));
    expect(values.size).toBeGreaterThan(1);
  });

  it('handles an empty seed string', () => {
    const v = seedNum('', 1, 10);
    expect(v).toBeGreaterThanOrEqual(1);
    expect(v).toBeLessThanOrEqual(10);
  });
});
