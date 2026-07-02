import { describe, it, expect } from 'vitest';
import { simulatedSleepAdapter as adapter } from './adapter';
import {
  buildTrend,
  sleepReadiness,
  nightStages,
  sleepTips,
  sleepTracker,
  fmtClock,
  rangeDays,
} from './sleep';

const NOW = new Date('2026-06-16T12:00:00Z');

describe('simulated sleep adapter', () => {
  it('is deterministic for a given date', () => {
    expect(adapter.getNight('2026-06-16')).toEqual(adapter.getNight('2026-06-16'));
    expect(adapter.simulated).toBe(true);
  });

  it('produces stage fractions that sum to ~1 and in-range values', () => {
    const n = adapter.getNight('2026-06-16');
    const sum = n.deepFraction + n.remFraction + n.lightFraction + n.awakeFraction;
    expect(sum).toBeCloseTo(1, 5);
    expect(n.hours).toBeGreaterThanOrEqual(5.4);
    expect(n.hours).toBeLessThanOrEqual(9.2);
    expect(n.quality).toBeGreaterThanOrEqual(2);
    expect(n.quality).toBeLessThanOrEqual(5);
    expect(n.efficiency).toBeGreaterThanOrEqual(84);
  });

  it('differs night to night', () => {
    expect(adapter.getNight('2026-06-16').hours).not.toBe(adapter.getNight('2026-06-01').hours);
  });
});

describe('fmtClock', () => {
  it('formats minutes-past-midnight as a 12h clock', () => {
    expect(fmtClock(0)).toBe('12:00am');
    expect(fmtClock(330)).toBe('5:30am');
    expect(fmtClock(720)).toBe('12:00pm');
    expect(fmtClock(1350)).toBe('10:30pm');
    expect(fmtClock(1470)).toBe('12:30am'); // wraps past midnight
  });
});

describe('buildTrend', () => {
  it('shows daily bars for short ranges', () => {
    const t = buildTrend(adapter, '1W', NOW);
    expect(t.buckets).toHaveLength(7);
    expect(t.showLabels).toBe(true);
    expect(t.rangeAvg).toBeGreaterThan(0);
    expect(t.maxHours).toBeGreaterThanOrEqual(10);
  });

  it('buckets long ranges into averages without per-day labels', () => {
    const t = buildTrend(adapter, '6M', NOW);
    expect(t.buckets.length).toBeLessThan(182);
    expect(t.showLabels).toBe(false);
    expect(t.startLabel).toMatch(/[A-Za-z]/);
  });

  it('rangeDays maps each window', () => {
    expect(rangeDays('1W')).toBe(7);
    expect(rangeDays('1Y')).toBe(365);
  });
});

describe('sleepReadiness', () => {
  it('returns last night plus a scored band and recommendation', () => {
    const { night, readiness } = sleepReadiness(adapter, NOW);
    expect(night.date).toBe('2026-06-16');
    expect(readiness.score).toBeGreaterThanOrEqual(0);
    expect(readiness.score).toBeLessThanOrEqual(100);
    expect(['Primed', 'Ready', 'Moderate', 'Low']).toContain(readiness.band);
    expect(readiness.recommendation.length).toBeGreaterThan(10);
  });
});

describe('nightStages + tips + tracker', () => {
  it('returns the four stages with colours', () => {
    const stages = nightStages(adapter.getNight('2026-06-16'));
    expect(stages.map((s) => s[0])).toEqual(['Deep', 'REM', 'Light', 'Awake']);
    expect(stages[0]![2]).toMatch(/^#/);
  });

  it('always returns 1–5 tips including a consistency tip', () => {
    const trend = buildTrend(adapter, '2W', NOW);
    const tips = sleepTips(trend, adapter.getNight('2026-06-16'));
    expect(tips.length).toBeGreaterThanOrEqual(1);
    expect(tips.length).toBeLessThanOrEqual(5);
    expect(tips.some((t) => /consistent/i.test(t.title))).toBe(true);
  });

  it('reacts to a short average with a "get more hours" tip', () => {
    const lowTrend = { ...buildTrend(adapter, '2W', NOW), rangeAvg: 6 };
    const tips = sleepTips(lowTrend, adapter.getNight('2026-06-16'));
    expect(tips.some((t) => /more hours/i.test(t.title))).toBe(true);
  });

  it('picks the tracker but never the scale', () => {
    expect(sleepTracker(['Withings Smart Scale'])).toBeUndefined();
    expect(sleepTracker(['Garmin', 'Withings Smart Scale'])).toBe('Garmin');
    expect(sleepTracker([])).toBeUndefined();
  });
});
