import { describe, it, expect } from 'vitest';
import { computeStreak } from './streak';

const NOW = new Date('2026-06-16T12:00:00Z');

describe('computeStreak', () => {
  it('is zero for empty/undefined input', () => {
    expect(computeStreak(undefined, NOW)).toBe(0);
    expect(computeStreak([], NOW)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const done = [{ d: '2026-06-16' }, { d: '2026-06-15' }, { d: '2026-06-14' }];
    expect(computeStreak(done, NOW)).toBe(3);
  });

  it('starts from yesterday when today is not yet logged', () => {
    const done = [{ d: '2026-06-15' }, { d: '2026-06-14' }];
    expect(computeStreak(done, NOW)).toBe(2);
  });

  it('stops at the first gap', () => {
    const done = [{ d: '2026-06-16' }, { d: '2026-06-14' }];
    expect(computeStreak(done, NOW)).toBe(1);
  });

  it('counts a day only once even if logged twice', () => {
    const done = [{ d: '2026-06-16' }, { d: '2026-06-16' }, { d: '2026-06-15' }];
    expect(computeStreak(done, NOW)).toBe(2);
  });

  it('is zero when neither today nor yesterday is logged', () => {
    expect(computeStreak([{ d: '2026-06-10' }], NOW)).toBe(0);
  });
});
