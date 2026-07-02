import { describe, it, expect } from 'vitest';
import { readiness } from './readiness';

describe('readiness', () => {
  it('scores a great night as Primed', () => {
    const r = readiness({ hours: 8, quality: 5, deepFraction: 0.2, avg3Hours: 8 });
    expect(r.score).toBe(100);
    expect(r.band).toBe('Primed');
    expect(r.color).toBe('#34D399');
  });

  it('scores a poor night as Low', () => {
    const r = readiness({ hours: 5, quality: 2, deepFraction: 0.1, avg3Hours: 5 });
    expect(r.score).toBeLessThan(55);
    expect(r.band).toBe('Low');
    expect(r.color).toBe('#FF5C5C');
  });

  it('maps mid scores to Ready and Moderate bands', () => {
    const ready = readiness({ hours: 7.5, quality: 4, deepFraction: 0.14, avg3Hours: 6 });
    expect(ready.score).toBe(83);
    expect(ready.band).toBe('Ready');

    const moderate = readiness({ hours: 6.5, quality: 3, deepFraction: 0.15, avg3Hours: 6 });
    expect(moderate.score).toBe(67);
    expect(moderate.band).toBe('Moderate');
  });

  it('clamps the score to 0–100', () => {
    expect(readiness({ hours: 100, quality: 100, deepFraction: 1, avg3Hours: 100 }).score).toBe(
      100,
    );
    expect(
      readiness({ hours: 0, quality: 0, deepFraction: 0, avg3Hours: 0 }).score,
    ).toBeLessThanOrEqual(100);
  });

  it('treats non-finite inputs as zero rather than producing NaN', () => {
    const r = readiness({ hours: NaN, quality: NaN, deepFraction: NaN, avg3Hours: NaN });
    expect(Number.isFinite(r.score)).toBe(true);
    expect(r.band).toBe('Low');
  });
});
