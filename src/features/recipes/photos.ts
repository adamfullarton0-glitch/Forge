import type { Recipe } from './data';

/**
 * Curated photos for the hand-written featured/breakfast recipes: each maps to
 * a TheMealDB dish-search keyword that returns a representative real photo (a
 * real burrito photo for the burrito bowl, etc.). Everything not listed here —
 * including all ~560 generated recipes — uses the branded gradient tile, so
 * there are no mismatched stock photos.
 */
export const RECIPE_PHOTO_QUERY: Record<string, string> = {
  'Chicken Burrito Bowl': 'burrito',
  'Salmon, Rice & Greens': 'salmon',
  'Turkey Chili': 'chilli',
  'Beef Stir-Fry Noodles': 'noodles',
  'Protein Pancakes': 'pancakes',
  'Tofu Veggie Curry': 'curry',
  'Tuna Pasta Salad': 'pasta',
  'Shrimp Tacos': 'tacos',
  'Egg White Veggie Omelette': 'omelette',
  'Chicken & Sweet Potato Traybake': 'chicken',
  'Banana Protein Pancakes': 'pancakes',
  'Three-Egg Veggie Scramble': 'omelette',
  'Spinach & Feta Omelette': 'omelette',
  'Smoked Salmon Avocado Toast': 'salmon',
  'Peanut Butter Overnight Oats': 'porridge',
  'Protein Berry Oats': 'porridge',
};

/** The TheMealDB search keyword for a recipe, or null (→ gradient tile). */
export function photoQueryFor(r: Recipe): string | null {
  return RECIPE_PHOTO_QUERY[r.name] ?? null;
}

/** The distinct keywords to fetch up front (deduped). */
export const PHOTO_QUERIES: string[] = [...new Set(Object.values(RECIPE_PHOTO_QUERY))];

/** Resolves a recipe to a fetched thumbnail URL, or null for the tile. */
export function recipePhoto(r: Recipe, thumbs: Record<string, string> | null): string | null {
  if (!thumbs) return null;
  const q = photoQueryFor(r);
  return q ? (thumbs[q] ?? null) : null;
}
