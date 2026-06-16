import type { Recipe } from './data';

/** Categories + ingredient terms we pull TheMealDB photos for. */
export const PHOTO_CATS = ['Chicken', 'Beef', 'Pork', 'Seafood', 'Vegetarian'] as const;
export const PHOTO_INGS = [
  'Chicken Breast',
  'Turkey',
  'Beef',
  'Salmon',
  'Cod',
  'Tuna',
  'Prawns',
  'Eggs',
  'Tofu',
  'Chicken',
  'Pork',
  'Halloumi',
] as const;
/** Photo term per generated-protein index (parallel to GP). */
const ING_PHOTO = [
  'Chicken Breast',
  'Turkey',
  'Beef',
  'Salmon',
  'Cod',
  'Tuna',
  'Prawns',
  'Eggs',
  'Tofu',
  'Chicken',
  'Cheese',
  'Pork',
  'Tofu',
  'Halloumi',
];

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
  const prep = Math.max(5, Math.round(total * 0.35));
  return {
    total,
    prep,
    cook: Math.max(5, total - prep),
    diff: total <= 15 ? 'Easy' : total <= 30 ? 'Medium' : 'Involved',
  };
}

/** Deterministic hash → index, used to pick a stable photo per recipe. */
export function hashIdx(strInput: string, n: number): number {
  let h = 7;
  for (let i = 0; i < strInput.length; i++) h = (h * 31 + strInput.charCodeAt(i)) >>> 0;
  return n > 0 ? h % n : h;
}

function featTerm(r: Recipe): string | null {
  const j = (r.ing || []).join(' ').toLowerCase();
  if (/salmon/.test(j)) return 'Salmon';
  if (/tuna/.test(j)) return 'Tuna';
  if (/cod/.test(j)) return 'Cod';
  if (/prawn|shrimp/.test(j)) return 'Prawns';
  if (/chicken|turkey/.test(j)) return 'Chicken';
  if (/beef|steak/.test(j)) return 'Beef';
  if (/pork|bacon|ham/.test(j)) return 'Pork';
  if (/halloumi/.test(j)) return 'Halloumi';
  if (/tofu|tempeh/.test(j)) return 'Tofu';
  if (/egg/.test(j)) return 'Eggs';
  return null;
}

function photoTerm(r: Recipe): string | null {
  if (r.pIdx != null) return ING_PHOTO[r.pIdx] ?? null;
  return featTerm(r);
}

/** Picks a stable photo URL for a recipe from the fetched photo map, or null. */
export function photoFor(r: Recipe, photos: Record<string, string[]> | null): string | null {
  if (!photos) return null;
  const term = photoTerm(r);
  let arr = term ? photos[term] : undefined;
  if (!arr || arr.length === 0) arr = photos[catOf(r)];
  if (!arr || arr.length === 0) return null;
  return arr[hashIdx(r.name, arr.length)] ?? null;
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
    return dislikes.some((d) => lower.includes(d) || d.includes(lower));
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
    list = list.filter((r) => r.name.toLowerCase().includes(q) || r.ing.some((i) => i.includes(q)));
  }
  if (f.meal !== 'all') list = list.filter((r) => mealOf(r) === f.meal);
  if (f.cat !== 'all') list = list.filter((r) => catOf(r) === f.cat);
  if (f.diet === 'goal') list = list.filter((r) => r.goal.includes(f.goal));
  else if (f.diet === 'hp') list = list.filter((r) => r.p >= 40);
  else if (f.diet === 'low') list = list.filter((r) => r.kcal < 500);
  if (f.time === '15') list = list.filter((r) => recipeMins(r) <= 15);
  else if (f.time === '30') list = list.filter((r) => recipeMins(r) <= 30);

  if (f.sort === 'time') list = [...list].sort((a, b) => recipeMins(a) - recipeMins(b));
  else if (f.sort === 'protein') list = [...list].sort((a, b) => b.p - a.p);
  else if (f.sort === 'kcal') list = [...list].sort((a, b) => a.kcal - b.kcal);

  return list;
}
