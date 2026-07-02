import type { Recipe } from './data';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Infers the meal type for a recipe. */
export function mealOf(r: Recipe): MealType {
  if (r.meal === 'breakfast' || r.meal === 'lunch' || r.meal === 'dinner' || r.meal === 'snack') {
    return r.meal;
  }
  const j = (r.name || '').toLowerCase();
  if (
    /pancake|porridge|oats|overnight|granola|omelette|scramble|smoothie|toast|bagel|waffle|muesli|chia|shakshuka|frittata|breakfast/.test(
      j,
    )
  ) {
    return 'breakfast';
  }
  const k = r.kcal || 0;
  if (k <= 380) return 'snack';
  if (k >= 600) return 'dinner';
  return 'lunch';
}

export type RecipeCategory = 'Chicken' | 'Beef' | 'Pork' | 'Seafood' | 'Vegetarian';

/** Infers a protein category from a recipe's ingredients. */
export function catOf(r: Recipe): RecipeCategory {
  const j = (r.ing || []).join(' ').toLowerCase();
  if (/chicken|turkey/.test(j)) return 'Chicken';
  if (/beef|steak/.test(j)) return 'Beef';
  if (/pork|bacon|ham/.test(j)) return 'Pork';
  if (/salmon|tuna|cod|fish|prawn|shrimp|shellfish|seafood/.test(j)) return 'Seafood';
  return 'Vegetarian';
}

/** Total minutes from a recipe's time string (defaults to 30). */
export function recipeMins(r: Recipe): number {
  const m = (r.time || '').match(/\d+/);
  return m ? Number(m[0]) : 30;
}

export interface RecipeMeta {
  total: number;
  prep: number;
  cook: number;
  diff: 'Easy' | 'Medium' | 'Involved';
}

export function recipeMeta(r: Recipe): RecipeMeta {
  const total = recipeMins(r);
  // Prep + cook must never exceed the total (a 3-min shake is not
  // "5 min prep · 5 min cook").
  const prep = Math.min(total, Math.max(1, Math.round(total * 0.35)));
  return {
    total,
    prep,
    cook: Math.max(0, total - prep),
    diff: total <= 15 ? 'Easy' : total <= 30 ? 'Medium' : 'Involved',
  };
}

/**
 * How many servings a recipe's ingredient list makes. Real-library dishes list
 * whole-dish quantities while their macros are per serving (the import divides
 * by these same counts — see scripts/build-real-recipes.mjs); hand-written and
 * custom recipes are single-serving.
 */
export function recipeServes(r: Recipe): number {
  if (!r.cat) return 1;
  return r.cat === 'Dessert' ? 8 : r.cat === 'Breakfast' ? 2 : 4;
}

export interface RecipeFilters {
  allergies: string[];
  dislikes: string[];
  goal: string;
  q: string;
  meal: string;
  cat: string;
  diet: string;
  time: string;
  sort: string;
}

/** True if a recipe is safe for the given allergies + dislikes. */
export function isSafe(r: Recipe, allergies: string[], dislikes: string[]): boolean {
  if (r.allergens.some((a) => allergies.includes(a))) return false;
  return !r.ing.some((ing) => {
    const lower = ing.toLowerCase();
    // Only filter when the ingredient actually contains the disliked term.
    // (The reverse direction over-filtered: disliking "eggplant" dropped "egg".)
    return dislikes.some((d) => lower.includes(d));
  });
}

/** Whether a recipe is unlocked for the user (PRO, featured, or a free sample). */
export function canSee(r: Recipe, pro: boolean): boolean {
  return pro || !!r.featured || (r.gi !== undefined && r.gi < 24);
}

/** Applies search + filters + sort to a recipe list (not pro-gated). */
export function filterRecipes(recipes: readonly Recipe[], f: RecipeFilters): Recipe[] {
  let list = recipes.filter((r) => isSafe(r, f.allergies, f.dislikes));

  const q = f.q.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (r) => r.name.toLowerCase().includes(q) || r.ing.some((i) => i.toLowerCase().includes(q)),
    );
  }
  if (f.meal !== 'all') list = list.filter((r) => mealOf(r) === f.meal);
  if (f.cat !== 'all') list = list.filter((r) => catOf(r) === f.cat);
  if (f.diet === 'goal') list = list.filter((r) => r.goal.includes(f.goal));
  else if (f.diet === 'hp') list = list.filter((r) => r.p >= 40);
  else if (f.diet === 'low') list = list.filter((r) => r.kcal < 400);
  if (f.time === '15') list = list.filter((r) => recipeMins(r) <= 15);
  else if (f.time === '30') list = list.filter((r) => recipeMins(r) <= 30);

  if (f.sort === 'time') list = [...list].sort((a, b) => recipeMins(a) - recipeMins(b));
  else if (f.sort === 'protein') list = [...list].sort((a, b) => b.p - a.p);
  else if (f.sort === 'kcal') list = [...list].sort((a, b) => a.kcal - b.kcal);

  return list;
}
