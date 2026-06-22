import manifest from './recipe-media.json';
import type { Recipe } from './data';

/**
 * Recipe photos. The hand-written featured / breakfast / snack recipes have a
 * curated, openly-licensed photo bundled in public/recipes/<slug>.jpg. Every
 * real-recipe-library dish has its own real photo bundled in
 * public/recipes/db/<id>.jpg (downloaded from TheMealDB at build time). Both are
 * served from our own origin — reliable and offline-cacheable. Only user-created
 * custom recipes fall back to the branded gradient tile.
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
 * resolve to their bundled photo by name; real-recipe-library dishes by their
 * bundled `img` id; custom recipes have none. Resolves under the deploy base.
 */
export function recipePhoto(r: Recipe, slugs: ReadonlySet<string> = SLUGS): string | null {
  const base = import.meta.env.BASE_URL;
  const slug = recipeSlug(r.name);
  if (slugs.has(slug)) return `${base}recipes/${slug}.jpg`;
  return r.img ? `${base}recipes/db/${r.img}.jpg` : null;
}
