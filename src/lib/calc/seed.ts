/**
 * Deterministic seeded integer in [min, max]. Used for the simulated device
 * data so the demo (and its tests) stay stable. Same seed → same number.
 */
export function seedNum(seed: string, min: number, max: number): number {
  let lo = Math.round(min);
  let hi = Math.round(max);
  if (hi < lo) [lo, hi] = [hi, lo];
  let h = 7;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return lo + (h % (hi - lo + 1));
}
