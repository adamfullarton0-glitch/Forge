import { describe, it, expect } from 'vitest';
import { ALL_RECIPES, GEN_RECIPES, gradOf, type Recipe } from './data';
import {
  mealOf,
  catOf,
  recipeMins,
  recipeMeta,
  hashIdx,
  isSafe,
  canSee,
  filterRecipes,
  photoFor,
} from './filter';
import { cookSteps } from './cooking';

const find = (name: string): Recipe => {
  const r = ALL_RECIPES.find((x) => x.name === name);
  if (!r) throw new Error(`missing recipe ${name}`);
  return r;
};

describe('recipe data', () => {
  it('generates the full library', () => {
    expect(GEN_RECIPES.length).toBe(14 * 10 * 4); // 560
    expect(ALL_RECIPES.length).toBeGreaterThanOrEqual(580);
  });

  it('gives every recipe sane macros and fields', () => {
    for (const r of ALL_RECIPES) {
      expect(r.name).toBeTruthy();
      expect(r.kcal).toBeGreaterThan(0);
      expect(Number.isFinite(r.p)).toBe(true);
      expect(Array.isArray(r.goal)).toBe(true);
      expect(Array.isArray(r.ing)).toBe(true);
    }
  });

  it('gradOf always returns a colour pair, even out of range', () => {
    expect(gradOf(0)).toHaveLength(2);
    expect(gradOf(999)).toHaveLength(2);
    expect(gradOf(-3)).toHaveLength(2);
  });
});

describe('classification helpers', () => {
  it('mealOf respects explicit meal then infers from name/kcal', () => {
    expect(mealOf({ meal: 'snack', name: 'X', kcal: 900 } as Recipe)).toBe('snack');
    expect(mealOf({ name: 'Protein Pancakes', kcal: 430 } as Recipe)).toBe('breakfast');
    expect(mealOf({ name: 'Mystery', kcal: 300 } as Recipe)).toBe('snack');
    expect(mealOf({ name: 'Mystery', kcal: 700 } as Recipe)).toBe('dinner');
    expect(mealOf({ name: 'Mystery', kcal: 500 } as Recipe)).toBe('lunch');
  });

  it('catOf infers protein category from ingredients', () => {
    expect(catOf({ ing: ['chicken', 'rice'] } as Recipe)).toBe('Chicken');
    expect(catOf({ ing: ['beef strips'] } as Recipe)).toBe('Beef');
    expect(catOf({ ing: ['salmon'] } as Recipe)).toBe('Seafood');
    expect(catOf({ ing: ['pork loin'] } as Recipe)).toBe('Pork');
    expect(catOf({ ing: ['tofu', 'rice'] } as Recipe)).toBe('Vegetarian');
  });

  it('recipeMins + recipeMeta parse the time string', () => {
    expect(recipeMins({ time: '25 min' } as Recipe)).toBe(25);
    expect(recipeMins({ time: '' } as Recipe)).toBe(30);
    const meta = recipeMeta({ time: '40 min' } as Recipe);
    expect(meta.total).toBe(40);
    expect(meta.prep + meta.cook).toBeLessThanOrEqual(meta.total + 5);
    expect(meta.diff).toBe('Involved');
    expect(recipeMeta({ time: '10 min' } as Recipe).diff).toBe('Easy');
  });

  it('hashIdx is deterministic and in range', () => {
    expect(hashIdx('Chicken', 5)).toBe(hashIdx('Chicken', 5));
    expect(hashIdx('Chicken', 5)).toBeLessThan(5);
    expect(hashIdx('x', 0)).toBeGreaterThanOrEqual(0);
  });
});

describe('safety + gating + filtering', () => {
  it('isSafe excludes allergens and disliked ingredients', () => {
    const r = { allergens: ['Fish'], ing: ['salmon', 'rice'] } as Recipe;
    expect(isSafe(r, [], [])).toBe(true);
    expect(isSafe(r, ['Fish'], [])).toBe(false);
    expect(isSafe(r, [], ['salmon'])).toBe(false);
  });

  it('canSee unlocks featured + first 24 generated for free users', () => {
    expect(canSee({ featured: true } as Recipe, false)).toBe(true);
    expect(canSee({ gi: 5 } as Recipe, false)).toBe(true);
    expect(canSee({ gi: 500 } as Recipe, false)).toBe(false);
    expect(canSee({ gi: 500 } as Recipe, true)).toBe(true);
  });

  it('filterRecipes applies search, diet, time and sort', () => {
    const base = {
      allergies: [],
      dislikes: [],
      goal: 'lose',
      q: '',
      meal: 'all',
      cat: 'all',
      diet: 'all',
      time: 'any',
      sort: 'default',
    };
    const hp = filterRecipes(ALL_RECIPES, { ...base, diet: 'hp' });
    expect(hp.every((r) => r.p >= 40)).toBe(true);

    const quick = filterRecipes(ALL_RECIPES, { ...base, time: '15' });
    expect(quick.every((r) => recipeMins(r) <= 15)).toBe(true);

    const byProtein = filterRecipes(ALL_RECIPES, { ...base, sort: 'protein' });
    expect(byProtein[0]!.p).toBeGreaterThanOrEqual(byProtein[byProtein.length - 1]!.p);

    const search = filterRecipes(ALL_RECIPES, { ...base, q: 'salmon' });
    expect(search.length).toBeGreaterThan(0);
    expect(
      search.every((r) => /salmon/i.test(r.name) || r.ing.some((i) => i.includes('salmon'))),
    ).toBe(true);
  });

  it('photoFor picks a stable photo or null', () => {
    const photos = { Chicken: ['a.jpg', 'b.jpg'], Salmon: ['s.jpg'] };
    const salmon = find('Salmon, Rice & Greens');
    expect(photoFor(salmon, photos)).toBe('s.jpg');
    expect(photoFor(salmon, null)).toBeNull();
    expect(photoFor({ ing: ['nothing'], name: 'X' } as Recipe, photos)).toBeNull();
  });
});

describe('cookSteps', () => {
  it('returns the hand-written steps for a meal recipe', () => {
    const m = cookSteps(find('Protein Berry Oats'));
    expect(m?.steps.length).toBeGreaterThan(0);
  });

  it('returns featured steps for a featured savoury recipe', () => {
    const m = cookSteps(find('Chicken Burrito Bowl'));
    expect(m?.steps[0]).toMatch(/rice/i);
    expect(m?.tip).toBeTruthy();
  });

  it('assembles a method for every generated recipe', () => {
    for (const r of GEN_RECIPES) {
      const m = cookSteps(r);
      expect(m, r.name).not.toBeNull();
      expect(m?.steps.length ?? 0).toBeGreaterThan(2);
    }
  });

  it('returns null when a recipe has no parts and no steps', () => {
    expect(
      cookSteps({
        name: 'Bare',
        kcal: 100,
        p: 1,
        c: 1,
        f: 1,
        allergens: [],
        ing: [],
        goal: [],
        time: '5 min',
        desc: '',
      }),
    ).toBeNull();
  });
});
