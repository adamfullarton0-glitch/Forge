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

/** Highest rep count a single set can seed/target (free-text is untrusted). */
const MAX_REPS = 100;

/** Pulls the top of a rep range like "4 × 6–8" → 8. Defaults to 12. */
export function topRepOf(setsReps: string): number {
  const s = setsReps || '';
  // Reps come after the "×" (sets are first); fall back to the whole string.
  const repPart = s.includes('×') ? s.slice(s.indexOf('×') + 1) : s;
  // Drop parenthetical annotations like "(T1)" / "(AMRAP)" that aren't reps.
  const cleaned = repPart.replace(/\([^)]*\)/g, ' ');
  // Time-based holds (e.g. "30–60s", "45 sec") aren't reps — use the default.
  if (/\d\s*(?:s|sec|secs|m|min|mins)\b/i.test(cleaned)) return 12;
  const nums = cleaned.match(/\d+/g);
  if (!nums || nums.length === 0) return 12;
  // The top of any range or scheme ("6–8", "5/3/1", "5,3,2") is its largest rep.
  const n = Math.max(...nums.map(Number));
  // Custom routine sets/reps are free text — clamp to a sane bound so an absurd
  // value can't seed nonsense reps or pollute e1RM/PR history.
  if (!Number.isFinite(n) || n <= 0) return 12;
  return Math.min(n, MAX_REPS);
}

/** Number of sets prescribed by a string like "4 × 6–8" → 4. Defaults to 3 (clamped 1–10). */
export function setsOf(setsReps: string): number {
  const m = (setsReps || '').match(/^\s*(\d+)/);
  const n = m ? Number(m[1]) : 3;
  if (!Number.isFinite(n) || n <= 0) return 3;
  return Math.min(n, 10);
}
