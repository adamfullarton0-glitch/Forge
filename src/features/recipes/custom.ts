/**
 * Bridges persisted user recipes (`CustomRecipe`) into the runtime `Recipe`
 * shape the library renders. Custom recipes are always `featured` (so they're
 * unlocked for free users and sort to the top) and flagged `custom` so the UI
 * can offer edit/delete.
 */
import type { Recipe } from './data';
import type { CustomRecipe } from '@/types/schemas';

export const CUSTOM_RECIPE_PREFIX = 'crec:';

export const isCustomRecipeId = (id: string | undefined): id is string =>
  typeof id === 'string' && id.startsWith(CUSTOM_RECIPE_PREFIX);

export function newCustomRecipeId(): string {
  return `${CUSTOM_RECIPE_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Convert a stored custom recipe into a renderable library recipe. */
export function customToRecipe(c: CustomRecipe): Recipe {
  return {
    id: c.id,
    name: c.name,
    time: c.time && c.time.trim() ? c.time : '15 min',
    kcal: c.kcal,
    p: c.p,
    c: c.c,
    f: c.f,
    allergens: [],
    ing: c.ing,
    goal: ['lose', 'maintain', 'gain'],
    desc: c.desc && c.desc.trim() ? c.desc : 'Your own recipe.',
    featured: true,
    custom: true,
    ...(c.meal ? { meal: c.meal } : {}),
    ...(c.steps && c.steps.length > 0 ? { steps: c.steps } : {}),
  };
}

/** Map the whole custom list, newest first. */
export function customRecipeList(customRecipes: readonly CustomRecipe[]): Recipe[] {
  return [...customRecipes].reverse().map(customToRecipe);
}
