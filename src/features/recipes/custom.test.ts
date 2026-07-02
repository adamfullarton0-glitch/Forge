import { describe, it, expect } from 'vitest';
import { customToRecipe, customRecipeList, isCustomRecipeId, newCustomRecipeId } from './custom';
import { mealOf } from './filter';
import { cookSteps } from './cooking';
import type { CustomRecipe } from '@/types/schemas';

const base: CustomRecipe = {
  id: 'crec:abc',
  name: 'My Chicken Bowl',
  kcal: 540,
  p: 48,
  c: 50,
  f: 14,
  ing: ['chicken breast', 'rice'],
  meal: 'lunch',
};

describe('customToRecipe', () => {
  it('maps a custom recipe into an unlocked, flagged library recipe', () => {
    const r = customToRecipe(base);
    expect(r.custom).toBe(true);
    expect(r.featured).toBe(true); // unlocked for free users
    expect(r.id).toBe('crec:abc');
    expect(r.kcal).toBe(540);
    expect(mealOf(r)).toBe('lunch');
    expect(r.allergens).toEqual([]);
    expect(r.goal).toEqual(['lose', 'maintain', 'gain']);
  });

  it('fills sensible defaults for time and description', () => {
    const r = customToRecipe({ ...base, time: undefined, desc: undefined });
    expect(r.time).toMatch(/min/);
    expect(r.desc.length).toBeGreaterThan(0);
  });

  it('exposes user method steps through cookSteps', () => {
    const r = customToRecipe({ ...base, steps: ['Cook the chicken.', 'Add rice.'] });
    expect(cookSteps(r)?.steps).toEqual(['Cook the chicken.', 'Add rice.']);
  });

  it('has no method when no steps were given', () => {
    expect(cookSteps(customToRecipe(base))).toBeNull();
  });
});

describe('customRecipeList', () => {
  it('lists newest first', () => {
    const list = customRecipeList([
      { ...base, id: 'crec:1', name: 'First' },
      { ...base, id: 'crec:2', name: 'Second' },
    ]);
    expect(list.map((r) => r.name)).toEqual(['Second', 'First']);
  });
});

describe('custom recipe ids', () => {
  it('detects and generates prefixed ids', () => {
    expect(isCustomRecipeId('crec:x')).toBe(true);
    expect(isCustomRecipeId('ppl')).toBe(false);
    expect(isCustomRecipeId(undefined)).toBe(false);
    const id = newCustomRecipeId();
    expect(isCustomRecipeId(id)).toBe(true);
    expect(newCustomRecipeId()).not.toBe(id);
  });
});
