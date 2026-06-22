import manifest from './recipe-media.json';
import comboManifest from './recipe-combo-media.json';
import { GP, GF, type Recipe } from './data';

/**
 * Bundled recipe photos. Each hand-written featured / breakfast / snack recipe
 * has a real, openly-licensed photo searched up by its name; each of the ~560
 * generated combos gets a photo for its protein × format (the two things that
 * change how the dish looks). Both are shipped in public/recipes/ (see
 * scripts/fetch-recipe-media.mjs) and served from the app's own origin. Only
 * user-created custom recipes fall back to the branded gradient tile.
 */

const SLUGS = new Set<string>(manifest);
const COMBO_SLUGS = new Set<string>(comboManifest);

/** A filename-safe slug for a recipe name (matches the fetch script). */
export function recipeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The protein × format photo key for a generated recipe, or null. */
export function comboKey(r: Recipe): string | null {
  if (r.pIdx == null) return null;
  const protein = GP[r.pIdx]?.[0];
  const format = r.fmt ?? GF[0];
  return protein ? `${recipeSlug(protein)}-${recipeSlug(format)}` : null;
}

/** True when a bundled photo exists for this recipe name (featured/meal). */
export function hasRecipePhoto(name: string, slugs: ReadonlySet<string> = SLUGS): boolean {
  return slugs.has(recipeSlug(name));
}

/**
 * The bundled photo URL for a recipe, or null (→ gradient tile). Featured/meal
 * recipes resolve by name; generated combos by protein × format; custom recipes
 * have no bundled photo. Resolves under the deploy base for the Pages sub-path.
 */
export function recipePhoto(
  r: Recipe,
  slugs: ReadonlySet<string> = SLUGS,
  combos: ReadonlySet<string> = COMBO_SLUGS,
): string | null {
  const base = import.meta.env.BASE_URL;
  const slug = recipeSlug(r.name);
  if (slugs.has(slug)) return `${base}recipes/${slug}.jpg`;
  const key = comboKey(r);
  if (key && combos.has(key)) return `${base}recipes/gen/${key}.jpg`;
  return null;
}
