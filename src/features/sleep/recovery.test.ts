import { describe, it, expect } from 'vitest';
import { simulatedSleepAdapter } from './adapter';
import { hrvBaseline, recoveryStatus, buildRecovery, HRV_TREND_DAYS } from './recovery';
import type { DeviceSleepAdapter, NightSummary } from './adapter';

const NOW = new Date('2026-06-16T12:00:00Z');

/** A fake adapter whose HRV is fixed by a per-date map (default 50). */
function fakeAdapter(hrvByDate: Record<string, number>, fallback = 50): DeviceSleepAdapter {
  return {
    simulated: true,
    getNight(date: string): NightSummary {
      const hrv = hrvByDate[date] ?? fallback;
      return {
        date,
        hours: 8,
        quality: 4,
        deepFraction: 0.2,
        remFraction: 0.2,
        lightFraction: 0.55,
        awakeFraction: 0.05,
        bedMinutes: 1380,
        wakeMinutes: 420,
        restingHr: 52,
        hrv,
        respiratory: 14.5,
        efficiency: 92,
      };
    },
  };
}

describe('recoveryStatus', () => {
  it('flags Strained when HRV is well below baseline', () => {
    const s = recoveryStatus(40, 50);
    expect(s.band).toBe('Strained');
    expect(s.deviation).toBeCloseTo(-0.2);
  });

  it('flags Elevated when HRV is well above baseline', () => {
    expect(recoveryStatus(60, 50).band).toBe('Elevated');
  });

  it('flags Balanced inside the ±8% normal band', () => {
    expect(recoveryStatus(51, 50).band).toBe('Balanced');
    expect(recoveryStatus(50, 50).deviation).toBe(0);
  });

  it('never divides by zero on a missing baseline', () => {
    expect(() => recoveryStatus(50, 0)).not.toThrow();
  });
});

describe('hrvBaseline', () => {
  it('averages HRV across the window', () => {
    const adapter = fakeAdapter({}, 60); // every night is 60
    expect(hrvBaseline(adapter, NOW, 14)).toBe(60);
  });
});

describe('buildRecovery', () => {
  it('bundles today HRV, baseline, status and a trend of the right length', () => {
    const adapter = fakeAdapter({ '2026-06-16': 40 }, 60); // today low vs 60 baseline
    const rec = buildRecovery(adapter, NOW);
    expect(rec.hrv).toBe(40);
    expect(rec.baseline).toBeGreaterThan(55); // mostly 60s
    expect(rec.status.band).toBe('Strained');
    expect(rec.trend).toHaveLength(HRV_TREND_DAYS);
    expect(rec.trend[rec.trend.length - 1]?.date).toBe('2026-06-16'); // newest last
  });

  it('works against the real simulated adapter', () => {
    const rec = buildRecovery(simulatedSleepAdapter, NOW);
    expect(rec.hrv).toBeGreaterThan(0);
    expect(['Strained', 'Balanced', 'Elevated']).toContain(rec.status.band);
  });

  it('never lets a non-finite wearable reading reach the output', () => {
    // A real (untrusted) adapter could return NaN/Infinity for HRV.
    const broken: DeviceSleepAdapter = {
      simulated: false,
      getNight: (date) => ({
        date,
        hours: 8,
        quality: 4,
        deepFraction: 0.2,
        remFraction: 0.2,
        lightFraction: 0.55,
        awakeFraction: 0.05,
        bedMinutes: 1380,
        wakeMinutes: 420,
        restingHr: Number.POSITIVE_INFINITY,
        hrv: NaN,
        respiratory: NaN,
        efficiency: 92,
      }),
    };
    const rec = buildRecovery(broken, NOW);
    expect(Number.isFinite(rec.hrv)).toBe(true);
    expect(Number.isFinite(rec.baseline)).toBe(true);
    expect(Number.isFinite(rec.restingHr)).toBe(true);
    expect(Number.isFinite(rec.respiratory)).toBe(true);
    expect(Number.isFinite(rec.status.deviation)).toBe(true);
    expect(rec.trend.every((p) => Number.isFinite(p.hrv))).toBe(true);
  });
});
