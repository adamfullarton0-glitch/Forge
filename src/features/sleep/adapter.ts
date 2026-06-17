import { seedNum } from '@/lib/calc';

/**
 * THE single swap-point for wearable sleep data. Today it's a deterministic
 * simulation seeded by date (so the demo + tests are stable); a real
 * HealthKit / Google Fit / Garmin / WHOOP adapter drops in here later by
 * implementing the same interface — no UI changes required.
 */

export interface NightSummary {
  /** Night date as `YYYY-MM-DD`. */
  date: string;
  /** Total time asleep, hours. */
  hours: number;
  /** Derived quality, 0–5. */
  quality: number;
  /** Stage fractions of the night (sum ≈ 1). */
  deepFraction: number;
  remFraction: number;
  lightFraction: number;
  awakeFraction: number;
  /** Minutes past midnight you fell asleep / woke (may exceed 1440 for AM). */
  bedMinutes: number;
  wakeMinutes: number;
  restingHr: number;
  /** Heart-rate variability (rMSSD, ms) — the core recovery signal. */
  hrv: number;
  /** Respiratory rate, breaths per minute. */
  respiratory: number;
  /** Sleep efficiency, %. */
  efficiency: number;
}

export interface DeviceSleepAdapter {
  /** Sleep summary for a given `YYYY-MM-DD`. Pure + deterministic. */
  getNight(date: string): NightSummary;
  /** True while this is the seeded demo (the UI labels it honestly). */
  readonly simulated: boolean;
}

/** Deterministic demo adapter — same date always yields the same night. */
export const simulatedSleepAdapter: DeviceSleepAdapter = {
  simulated: true,
  getNight(date: string): NightSummary {
    const hours = Math.round(seedNum(date + 'slh', 54, 92)) / 10;
    const quality = seedNum(date + 'slq', 2, 5);

    const deep = seedNum(date + 'stgd', 13, 22);
    const rem = seedNum(date + 'stgr', 18, 25);
    const awake = seedNum(date + 'stga', 3, 7);
    const light = Math.max(28, 100 - deep - rem - awake);
    const total = deep + rem + awake + light;

    return {
      date,
      hours,
      quality,
      deepFraction: deep / total,
      remFraction: rem / total,
      lightFraction: light / total,
      awakeFraction: awake / total,
      bedMinutes: 21 * 60 + seedNum(date + 'bt', 30, 210),
      wakeMinutes: 5 * 60 + seedNum(date + 'wt', 30, 180),
      restingHr: seedNum(date + 'rhr', 47, 61),
      hrv: seedNum(date + 'hrv', 38, 86),
      respiratory: Math.round(seedNum(date + 'rr', 122, 168)) / 10,
      efficiency: seedNum(date + 'eff', 84, 96),
    };
  },
};
