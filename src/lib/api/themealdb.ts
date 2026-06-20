import { z } from 'zod';
import { fetchJson } from './http';

/**
 * TheMealDB client for the "discover real dishes" search and recipe photos.
 * Responses are validated with Zod; failures resolve to typed errors / empty
 * maps so the UI degrades gracefully instead of crashing.
 */

const BASE = 'https://www.themealdb.com/api/json/v1/1';

/** A real dish with a real photo + method. */
export interface Dish {
  id: string;
  name: string;
  thumb: string;
  category: string;
  area: string;
  steps: string[];
  youtube: string;
  ingredients: string[];
}

export type DishSearchResult = { ok: true; dishes: Dish[] } | { ok: false; error: string };

const RawMealSchema = z.record(z.string(), z.unknown());
const SearchSchema = z
  .object({ meals: z.array(RawMealSchema).nullable().catch(null) })
  .catch({ meals: null });

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

function mapMeal(raw: Record<string, unknown>): Dish {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = str(raw[`strIngredient${i}`]).trim();
    const measure = str(raw[`strMeasure${i}`]).trim();
    if (ing) ingredients.push((measure ? `${measure} ` : '') + ing);
  }
  const steps = str(raw.strInstructions)
    .split(/\r?\n+/)
    .map((s) => s.replace(/^\s*(STEP\s*\d+[:.]?)/i, '').trim())
    .filter((s) => s.length > 3);
  return {
    id: str(raw.idMeal),
    name: str(raw.strMeal),
    thumb: str(raw.strMealThumb),
    category: str(raw.strCategory),
    area: str(raw.strArea),
    steps,
    youtube: str(raw.strYoutube),
    ingredients,
  };
}

/** Searches TheMealDB by name. Empty term → empty results (no request). */
export async function searchMeals(term: string): Promise<DishSearchResult> {
  const q = term.trim();
  if (!q) return { ok: true, dishes: [] };
  try {
    const data = await fetchJson(`${BASE}/search.php?s=${encodeURIComponent(q)}`);
    const parsed = SearchSchema.parse(data);
    return { ok: true, dishes: (parsed.meals ?? []).map(mapMeal) };
  } catch {
    return { ok: false, error: "Couldn't reach the recipe database. Works in the live app." };
  }
}

/**
 * Fetches one representative thumbnail per dish keyword (by name search), used
 * to put an on-theme real photo on the curated featured recipes. Keywords with
 * no match are omitted, so callers fall back to a gradient tile. Never throws.
 */
export async function fetchNamedThumbs(
  queries: readonly string[],
): Promise<Record<string, string>> {
  const grab = async (q: string): Promise<readonly [string, string]> => {
    try {
      const data = await fetchJson(`${BASE}/search.php?s=${encodeURIComponent(q)}`);
      const parsed = SearchSchema.parse(data);
      const first = (parsed.meals ?? [])[0];
      const thumb = first ? str(first.strMealThumb) : '';
      return [q, thumb ? `${thumb}/medium` : ''];
    } catch {
      return [q, ''];
    }
  };
  try {
    const pairs = await Promise.all(queries.map(grab));
    return Object.fromEntries(pairs.filter(([, url]) => url !== ''));
  } catch {
    return {};
  }
}
