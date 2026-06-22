import manifest from './recipe-media.json';
import type { Recipe } from './data';

/**
 * Bundled recipe photos. Each hand-written featured / breakfast / snack recipe
 * has a real, openly-licensed photo searched up by its name and shipped in
 * public/recipes/<slug>.jpg (see scripts/fetch-recipe-media.mjs). They're served
 * from the app's own origin — offline-ready, no hotlinking — and the generated
 * combo recipes (and custom recipes) fall back to the branded gradient tile.
 */

const SLUGS = new Set<string>(manifest);

/** A filename-safe slug for a recipe name (matches the fetch script). */
export function recipeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** True when a bundled photo exists for this recipe name. */
export function hasRecipePhoto(name: string, slugs: ReadonlySet<string> = SLUGS): boolean {
  return slugs.has(recipeSlug(name));
}

/**
 * The bundled photo URL for a recipe, or null (→ gradient tile). Resolves under
 * the deploy base so it works at the GitHub Pages sub-path.
 */
export function recipePhoto(r: Recipe, slugs: ReadonlySet<string> = SLUGS): string | null {
  const slug = recipeSlug(r.name);
  return slugs.has(slug) ? `${import.meta.env.BASE_URL}recipes/${slug}.jpg` : null;
}
