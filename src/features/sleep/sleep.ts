import { readiness, todayKey, daysAgoKey, DAYS, type Readiness } from '@/lib/calc';
import { sleepStageColors } from '@/theme/pulse';
import type { DeviceSleepAdapter, NightSummary } from './adapter';

/** Trend windows offered by the range selector. */
export const SLEEP_RANGES = [
  ['1W', 7],
  ['2W', 14],
  ['1M', 30],
  ['3M', 91],
  ['6M', 182],
  ['1Y', 365],
] as const;
export type SleepRange = (typeof SLEEP_RANGES)[number][0];

export function rangeDays(range: SleepRange): number {
  return SLEEP_RANGES.find((r) => r[0] === range)?.[1] ?? 14;
}

const mean = (a: number[]): number => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const round1 = (x: number): number => Math.round(x * 10) / 10;

/** Formats minutes-past-midnight as a 12-hour clock, e.g. 1350 → "10:30pm". */
export function fmtClock(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = ((mins % 60) + 60) % 60;
  const ap = h < 12 ? 'am' : 'pm';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')}${ap}`;
}

function fromKey(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}
const dayInitial = (date: string): string => DAYS[(fromKey(date).getUTCDay() + 6) % 7]?.[0] ?? '';
const monthShort = (date: string): string =>
  fromKey(date).toLocaleDateString('en', { month: 'short', timeZone: 'UTC' });
const dayMonth = (date: string): string =>
  fromKey(date).toLocaleDateString('en', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export interface TrendBucket {
  label: string;
  hours: number;
  quality: number;
  date: string;
}

export interface SleepTrend {
  buckets: TrendBucket[];
  rangeAvg: number;
  avgQuality: number;
  bestHours: number;
  showLabels: boolean;
  maxHours: number;
  startLabel: string;
  endLabel: string;
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/** Builds the sleep-hours trend for a range — daily bars short-range, weekly/monthly averages long-range. */
export function buildTrend(
  adapter: DeviceSleepAdapter,
  range: SleepRange,
  now: Date = new Date(),
): SleepTrend {
  const days = rangeDays(range);
  const series = Array.from({ length: days }, (_, i) => {
    const date = daysAgoKey(days - 1 - i, now);
    const n = adapter.getNight(date);
    return { date, hours: n.hours, quality: n.quality };
  });

  let buckets: TrendBucket[];
  if (days <= 30) {
    buckets = series.map((s) => ({
      label: dayInitial(s.date),
      hours: s.hours,
      quality: s.quality,
      date: s.date,
    }));
  } else {
    const size = days <= 182 ? 7 : 30;
    buckets = chunk(series, size).map((g) => {
      const mid = g[Math.floor(g.length / 2)] ?? g[0];
      return {
        hours: round1(mean(g.map((x) => x.hours))),
        quality: Math.round(mean(g.map((x) => x.quality))),
        date: mid?.date ?? '',
        label: mid ? monthShort(mid.date) : '',
      };
    });
  }

  const first = series[0];
  const last = series[series.length - 1];
  return {
    buckets,
    rangeAvg: round1(mean(series.map((s) => s.hours))),
    avgQuality: round1(mean(series.map((s) => s.quality))),
    bestHours: series.reduce((m, s) => Math.max(m, s.hours), 0),
    showLabels: buckets.length <= 14,
    maxHours: Math.max(10, ...buckets.map((b) => b.hours)),
    startLabel: first ? dayMonth(first.date) : '',
    endLabel: last ? dayMonth(last.date) : '',
  };
}

export interface SleepReadiness extends Readiness {
  recommendation: string;
}

const RECS: Record<string, string> = {
  Primed: 'Fully recovered — green light for a heavy or high-intensity session today.',
  Ready: "Well recovered. You're good to train hard today.",
  Moderate: 'Partly recovered. Train, but keep volume sensible and leave a rep in reserve.',
  Low: 'Recovery is lagging. A lighter session, skills work, or a rest day will pay off more than grinding.',
};

/** Last night's summary plus the derived session-readiness score + band + advice. */
export function sleepReadiness(
  adapter: DeviceSleepAdapter,
  now: Date = new Date(),
): { night: NightSummary; readiness: SleepReadiness } {
  const night = adapter.getNight(todayKey(now));
  const avg3 = mean([0, 1, 2].map((o) => adapter.getNight(daysAgoKey(o, now)).hours));
  const r = readiness({
    hours: night.hours,
    quality: night.quality,
    deepFraction: night.deepFraction,
    avg3Hours: avg3,
  });
  return { night, readiness: { ...r, recommendation: RECS[r.band] ?? RECS.Low ?? '' } };
}

/** Last-night sleep stages as [name, fraction, colour] for the bar. */
export function nightStages(night: NightSummary): ReadonlyArray<[string, number, string]> {
  return [
    ['Deep', night.deepFraction, sleepStageColors.deep],
    ['REM', night.remFraction, sleepStageColors.rem],
    ['Light', night.lightFraction, sleepStageColors.light],
    ['Awake', night.awakeFraction, sleepStageColors.awake],
  ];
}

export interface SleepTip {
  icon: string;
  title: string;
  text: string;
}

/** Up to five improvement tips that react to the trend + last night. */
export function sleepTips(trend: SleepTrend, night: NightSummary): SleepTip[] {
  const tips: SleepTip[] = [];
  if (trend.rangeAvg < 7) {
    tips.push({
      icon: 'clock',
      title: 'Get more hours',
      text: `You're averaging ${trend.rangeAvg}h. Aim to be in bed 30–45 minutes earlier — small gains compound fast.`,
    });
  } else {
    tips.push({
      icon: 'check',
      title: 'Good duration',
      text: `Your ${trend.rangeAvg}h average sits in a healthy range. Protect that bedtime.`,
    });
  }
  if (night.deepFraction < 0.15) {
    tips.push({
      icon: 'moon',
      title: 'Lift your deep sleep',
      text: 'Deep sleep is on the low side. Skip late caffeine and alcohol, and keep the room cool (~18°C) and dark.',
    });
  }
  if (trend.avgQuality < 3.2) {
    tips.push({
      icon: 'bolt',
      title: 'Smooth out quality',
      text: 'Quality is patchy. A screen-free wind-down 30 minutes before bed makes the biggest difference.',
    });
  }
  if (night.efficiency < 88) {
    tips.push({
      icon: 'target',
      title: 'Improve efficiency',
      text: `You're spending time awake in bed (${night.efficiency}% efficiency). If you can't sleep after ~20 min, get up briefly, then return.`,
    });
  }
  tips.push({
    icon: 'star',
    title: 'Stay consistent',
    text: 'Same bed and wake time — even on weekends — is the single biggest lever for sleep quality.',
  });
  return tips.slice(0, 5);
}

/** Picks the connected sleep tracker (the scale is not a sleep source). */
export function sleepTracker(devices: readonly string[]): string | undefined {
  return devices.find((d) => d !== 'Withings Smart Scale');
}
