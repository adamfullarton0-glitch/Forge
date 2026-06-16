import { describe, it, expect } from 'vitest';
import { calcTargets, calorieGuide, type TargetsProfile } from './nutrition';

const base: TargetsProfile = {
  sex: 'm',
  weight: 80,
  height: 180,
  age: 30,
  goal: 'maintain',
  activity: 'moderate',
};

describe('calcTargets', () => {
  it('returns sensible defaults with no profile', () => {
    expect(calcTargets(null)).toEqual({ kcal: 2200, protein: 150, carbs: 230, fat: 65 });
    expect(calcTargets(undefined)).toEqual({ kcal: 2200, protein: 150, carbs: 230, fat: 65 });
  });

  it('computes maintenance for a male profile', () => {
    // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 1780; *1.55 = 2759
    const t = calcTargets(base);
    expect(t.kcal).toBe(2759);
    expect(t.protein).toBe(144); // round(1.8*80)
    expect(t.fat).toBe(Math.round((2759 * 0.25) / 9));
    expect(t.carbs).toBeGreaterThan(0);
  });

  it('subtracts for a cut and adds for a bulk', () => {
    expect(calcTargets({ ...base, goal: 'lose' }).kcal).toBe(2759 - 450);
    expect(calcTargets({ ...base, goal: 'gain' }).kcal).toBe(2759 + 300);
  });

  it('uses the female BMR offset', () => {
    const t = calcTargets({ ...base, sex: 'f' });
    expect(t.kcal).toBe(Math.max(1200, Math.round((10 * 80 + 6.25 * 180 - 5 * 30 - 161) * 1.55)));
  });

  it('falls back to a 1.4 multiplier for unknown or missing activity', () => {
    const known = calcTargets({ ...base, activity: 'moderate' });
    const unknown = calcTargets({ ...base, activity: 'wizard' });
    const missing = calcTargets({ sex: 'm', weight: 80, height: 180, age: 30 });
    expect(unknown.kcal).not.toBe(known.kcal);
    expect(missing.kcal).toBe(unknown.kcal); // both use the 1.4 fallback
  });

  it('never drops below the 1200 kcal floor', () => {
    expect(calcTargets({ ...base, weight: 1, height: 1, age: 99, goal: 'lose' }).kcal).toBe(1200);
  });

  it('returns defaults rather than NaN for non-finite stats', () => {
    expect(calcTargets({ ...base, weight: NaN }).kcal).toBe(2200);
  });
});

describe('calorieGuide', () => {
  it('returns null with no profile', () => {
    expect(calorieGuide(null)).toBeNull();
  });

  it('orders cut < maintenance < leanBulk < aggressiveBulk', () => {
    const g = calorieGuide(base);
    expect(g).not.toBeNull();
    if (g) {
      expect(g.cut).toBeLessThan(g.maintenance);
      expect(g.maintenance).toBeLessThan(g.leanBulk);
      expect(g.leanBulk).toBeLessThan(g.aggressiveBulk);
      expect(g.maintenance % 10).toBe(0);
    }
  });

  it('clamps every band to the 1200 floor', () => {
    const g = calorieGuide({ ...base, weight: 1, height: 1, age: 99 });
    expect(g?.cut).toBe(1200);
  });

  it('returns null for non-finite stats', () => {
    expect(calorieGuide({ ...base, height: Infinity })).toBeNull();
  });
});
