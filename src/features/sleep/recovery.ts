import { daysAgoKey, todayKey } from '@/lib/calc';
import type { DeviceSleepAdapter } from './adapter';

/**
 * HRV-based recovery, modelled the way wearables do it: today's heart-rate
 * variability is compared against your own rolling baseline, not an absolute
 * number. Everything here is pure and driven by the sleep adapter, so a real
 * wearable swaps in with no changes.
 */

/** Days of history used to establish the personal HRV baseline. */
export const BASELINE_DAYS = 14;
/** Points shown in the HRV sparkline. */
export const HRV_TREND_DAYS = 7;

export type RecoveryBand = 'Strained' | 'Balanced' | 'Elevated';

export interface RecoveryStatus {
  band: RecoveryBand;
  color: string;
  /** Today's HRV as a fraction of baseline, e.g. -0.12 = 12% below. */
  deviation: number;
  message: string;
}

const mean = (a: number[]): number => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

/** Rolling mean HRV over the trailing window (today inclusive). */
export function hrvBaseline(
  adapter: DeviceSleepAdapter,
  now: Date = new Date(),
  days: number = BASELINE_DAYS,
): number {
  const vals = Array.from(
    { length: Math.max(1, days) },
    (_, i) => adapter.getNight(daysAgoKey(i, now)).hrv,
  );
  return Math.round(mean(vals));
}

const BAND_META: Record<RecoveryBand, { color: string; message: string }> = {
  Elevated: {
    color: '#10B981',
    message:
      'HRV is above your baseline — your body is well recovered and primed for a hard session.',
  },
  Balanced: {
    color: '#3D8BFF',
    message: "HRV is in your normal range. You're recovered — train as planned.",
  },
  Strained: {
    color: '#FF5C5C',
    message:
      'HRV is below your baseline — a sign of fatigue or stress. Favour lighter training, hydration and an early night.',
  },
};

/** Classifies today's HRV against the baseline (±8% defines the normal band). */
export function recoveryStatus(hrv: number, baseline: number): RecoveryStatus {
  const base = baseline > 0 ? baseline : 1;
  const deviation = (hrv - base) / base;
  const band: RecoveryBand =
    deviation >= 0.08 ? 'Elevated' : deviation <= -0.08 ? 'Strained' : 'Balanced';
  const meta = BAND_META[band];
  return { band, color: meta.color, deviation, message: meta.message };
}

export interface HrvPoint {
  date: string;
  hrv: number;
}

export interface RecoverySummary {
  hrv: number;
  baseline: number;
  restingHr: number;
  respiratory: number;
  status: RecoveryStatus;
  /** Oldest → newest HRV points for the sparkline. */
  trend: HrvPoint[];
}

/** Bundles last night's recovery biometrics + baseline + status + HRV trend. */
export function buildRecovery(
  adapter: DeviceSleepAdapter,
  now: Date = new Date(),
): RecoverySummary {
  const night = adapter.getNight(todayKey(now));
  const baseline = hrvBaseline(adapter, now);
  const trend: HrvPoint[] = Array.from({ length: HRV_TREND_DAYS }, (_, i) => {
    const date = daysAgoKey(HRV_TREND_DAYS - 1 - i, now);
    return { date, hrv: adapter.getNight(date).hrv };
  });
  return {
    hrv: night.hrv,
    baseline,
    restingHr: night.restingHr,
    respiratory: night.respiratory,
    status: recoveryStatus(night.hrv, baseline),
    trend,
  };
}
