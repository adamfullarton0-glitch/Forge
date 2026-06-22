import manifest from './recipe-media.json';
import type { Recipe } from './data';

/**
 * Recipe photos. The hand-written featured / breakfast / snack recipes have a
 * curated, openly-licensed photo bundled in public/recipes/<slug>.jpg (offline,
 * served from our own origin). Every real-recipe-library dish carries its own
 * real photo URL (`thumb`, from TheMealDB's CDN), shown directly and cached on
 * view. Only user-created custom recipes fall back to the branded gradient tile.
 */

const SLUGS = new Set<string>(manifest);

/** A filename-safe slug for a recipe name (matches the fetch script). */
export function recipeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** True when a bundled photo exists for this recipe name (featured/meal). */
export function hasRecipePhoto(name: string, slugs: ReadonlySet<string> = SLUGS): boolean {
  return slugs.has(recipeSlug(name));
}

/**
 * The photo URL for a recipe, or null (→ gradient tile). Featured/meal recipes
 * resolve to their bundled photo by name; real-recipe-library dishes use their
 * own `thumb`; custom recipes have none. Resolves under the deploy base.
 */
export function recipePhoto(r: Recipe, slugs: ReadonlySet<string> = SLUGS): string | null {
  const slug = recipeSlug(r.name);
  if (slugs.has(slug)) return `${import.meta.env.BASE_URL}recipes/${slug}.jpg`;
  return r.thumb ?? null;
}
