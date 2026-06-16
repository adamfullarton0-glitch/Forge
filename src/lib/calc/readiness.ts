import { readinessBands } from '@/theme/pulse';

/** Session-readiness score (0–100) from last night's sleep + recent trend. */

export interface ReadinessInput {
  /** Last night's sleep duration in hours. */
  hours: number;
  /** Subjective/derived quality, 0–5. */
  quality: number;
  /** Deep-sleep fraction of the night, 0–1. */
  deepFraction: number;
  /** Rolling 3-day average sleep hours. */
  avg3Hours: number;
}

export interface Readiness {
  score: number;
  band: string;
  color: string;
}

const safe = (n: number): number => (Number.isFinite(n) ? n : 0);

export function readiness(input: ReadinessInput): Readiness {
  const hours = safe(input.hours);
  const quality = safe(input.quality);
  const deep = safe(input.deepFraction);
  const avg3 = safe(input.avg3Hours);

  const hourPts = hours >= 7.5 ? 40 : hours >= 6.5 ? 30 : hours >= 5.5 ? 18 : 8;
  const deepPts = deep >= 0.18 ? 18 : deep >= 0.14 ? 12 : 6;
  const avgPts = avg3 >= 7 ? 12 : avg3 >= 6 ? 7 : 3;

  const score = Math.max(0, Math.min(100, Math.round(hourPts + quality * 6 + deepPts + avgPts)));

  // The last band ('Low') has min 0, so a band is always selected — the
  // initial value is just there to satisfy the type, never the result.
  let band = 'Low';
  let color = '#FF5C5C';
  for (const b of readinessBands) {
    if (score >= b.min) {
      band = b.name;
      color = b.color;
      break;
    }
  }
  return { score, band, color };
}
