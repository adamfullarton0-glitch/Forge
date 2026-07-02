import { describe, it, expect } from 'vitest';
import { DAYS, todayKey, dayIdx, weekStartKey, daysAgoKey } from './dates';

const TUE = new Date('2026-06-16T12:00:00Z'); // Tuesday
const MON = new Date('2026-06-15T12:00:00Z'); // Monday
const SUN = new Date('2026-06-14T12:00:00Z'); // Sunday

describe('date helpers', () => {
  it('DAYS is Monday-first', () => {
    expect(DAYS[0]).toBe('Mon');
    expect(DAYS).toHaveLength(7);
  });

  it('todayKey formats as YYYY-MM-DD', () => {
    expect(todayKey(TUE)).toBe('2026-06-16');
  });

  it('dayIdx is Monday = 0 … Sunday = 6', () => {
    expect(dayIdx(MON)).toBe(0);
    expect(dayIdx(TUE)).toBe(1);
    expect(dayIdx(SUN)).toBe(6);
  });

  it('weekStartKey returns the Monday of the week', () => {
    expect(weekStartKey(TUE)).toBe('2026-06-15');
    expect(weekStartKey(MON)).toBe('2026-06-15');
    expect(weekStartKey(SUN)).toBe('2026-06-08');
  });

  it('daysAgoKey steps back n days', () => {
    expect(daysAgoKey(0, TUE)).toBe('2026-06-16');
    expect(daysAgoKey(7, TUE)).toBe('2026-06-09');
  });
});
