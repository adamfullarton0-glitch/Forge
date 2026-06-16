/** Lifting maths: estimated 1RM, rep parsing, and plate loading. All pure. */

/** Standard Olympic barbell weight in kg. */
export const BAR_KG = 20;

/** Available plate denominations per side, heaviest first (kg). */
export const PLATE_KG = [25, 20, 15, 10, 5, 2.5, 1.25] as const;

/**
 * Plates to load PER SIDE to reach `kg` on a bar of `bar` kg.
 * Returns [] for anything at or below the empty bar (and guards non-finite input).
 */
export function platesFor(kg: number, bar: number = BAR_KG): number[] {
  if (!Number.isFinite(kg) || !Number.isFinite(bar)) return [];
  let per = (kg - bar) / 2;
  if (per <= 0.01) return [];
  const out: number[] = [];
  for (const p of PLATE_KG) {
    while (per >= p - 1e-9) {
      out.push(p);
      per = Math.round((per - p) * 100) / 100;
    }
  }
  return out;
}

/** Epley estimated one-rep max. Single reps (or fewer) return the weight itself. */
export function e1rm(weight: number, reps: number): number {
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return 0;
  return reps <= 1 ? weight : Math.round(weight * (1 + reps / 30));
}

/** Pulls the top of a rep range like "4 × 6–8" → 8. Defaults to 12. */
export function topRepOf(setsReps: string): number {
  const nums = (setsReps || '').match(/\d+/g);
  if (!nums || nums.length === 0) return 12;
  return Number(nums[nums.length - 1]);
}
