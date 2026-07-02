import { describe, it, expect } from 'vitest';
import { ALL_RECIPES, REAL_RECIPES, gradOf, type Recipe } from './data';
import { mealOf, catOf, recipeMins, recipeMeta, isSafe, canSee, filterRecipes } from './filter';
import { recipePhoto, recipeSlug, hasRecipePhoto } from './media';
import { cookSteps } from './cooking';

const find = (name: string): Recipe => {
  const r = ALL_RECIPES.find((x) => x.name === name);
  if (!r) throw new Error(`missing recipe ${name}`);
  return r;
};

describe('recipe data', () => {
  it('loads a curated high-protein real-recipe library', () => {
    expect(REAL_RECIPES.length).toBeGreaterThan(150); // high-protein subset
    expect(ALL_RECIPES.length).toBeGreaterThan(REAL_RECIPES.length); // + featured
    for (const r of REAL_RECIPES) {
      // Every dish is genuinely high-protein, with its own bundled photo + method.
      expect(r.p).toBeGreaterThanOrEqual(25);
      expect((r.p * 4) / r.kcal).toBeGreaterThanOrEqual(0.22);
      expect(r.cat).not.toBe('Dessert');
      expect(r.img).toMatch(/^\d+$/);
      expect(r.steps?.length ?? 0).toBeGreaterThan(0);
    }
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

  it('makes a filename-safe slug matching the bundled photos', () => {
    expect(recipeSlug('Chicken Burrito Bowl')).toBe('chicken-burrito-bowl');
    expect(recipeSlug('Salmon, Rice & Greens')).toBe('salmon-rice-greens');
    expect(recipeSlug('Greek Yogurt & Honey')).toBe('greek-yogurt-honey');
  });

  it('bundles a photo for every hand-written featured/meal recipe', () => {
    for (const r of ALL_RECIPES.filter((x) => x.featured)) {
      expect(hasRecipePhoto(r.name)).toBe(true);
    }
  });

  it('gives every real recipe its own bundled photo', () => {
    for (const r of REAL_RECIPES) {
      expect(recipePhoto(r)).toBe(`/recipes/db/${r.img}.jpg`);
    }
  });
});

describe('safety + gating + filtering', () => {
  it('isSafe excludes allergens and disliked ingredients', () => {
    const r = { allergens: ['Fish'], ing: ['salmon', 'rice'] } as Recipe;
    expect(isSafe(r, [], [])).toBe(true);
    expect(isSafe(r, ['Fish'], [])).toBe(false);
    expect(isSafe(r, [], ['salmon'])).toBe(false);
  });

  it('canSee unlocks featured + a free sample of the library for free users', () => {
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
    // Ingredient matching is case-insensitive ("Salmon Fillet" matches "salmon").
    expect(
      search.every((r) => /salmon/i.test(r.name) || r.ing.some((i) => /salmon/i.test(i))),
    ).toBe(true);
  });

  it('recipePhoto resolves featured by name, real by bundled id, custom → null', () => {
    // import.meta.env.BASE_URL is '/' in the test env.
    expect(recipePhoto(find('Chicken Burrito Bowl'))).toBe('/recipes/chicken-burrito-bowl.jpg');
    expect(recipePhoto(find('Turkey Chili'))).toBe('/recipes/turkey-chili.jpg');
    // A real-library dish → its own bundled photo.
    expect(recipePhoto(REAL_RECIPES[0]!)).toBe(`/recipes/db/${REAL_RECIPES[0]!.img}.jpg`);
    // A custom recipe (no photo, not a featured name) → gradient tile.
    expect(recipePhoto({ name: 'My Custom Meal', custom: true } as Recipe)).toBeNull();
  });

  it('honours a provided manifest', () => {
    const slugs = new Set(['chicken-burrito-bowl']);
    expect(recipePhoto(find('Chicken Burrito Bowl'), slugs)).toBe(
      '/recipes/chicken-burrito-bowl.jpg',
    );
    expect(recipePhoto(find('Turkey Chili'), slugs)).toBeNull();
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

  it('returns the real method for every real recipe', () => {
    for (const r of REAL_RECIPES) {
      const m = cookSteps(r);
      expect(m, r.name).not.toBeNull();
      expect(m?.steps.length ?? 0).toBeGreaterThan(0);
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
