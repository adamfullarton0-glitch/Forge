import { z } from 'zod';
import { fetchJson } from './http';

/**
 * Open Food Facts client. Every response is `unknown` until validated with
 * Zod, every request has a timeout, and any failure (network, timeout, HTTP,
 * malformed JSON) resolves to a typed error rather than throwing — so the UI
 * can always show an empty/error state instead of crashing.
 */

const BASE = 'https://world.openfoodfacts.org';
const FIELDS = 'product_name,brands,nutriments,serving_size';

/** A normalised food item ready to log. */
export interface FoodItem {
  n: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  fiber: number;
  sugar: number;
  sodium: number;
  /** Saturated fat (g). */
  satfat: number;
  /** Potassium (mg). */
  potassium: number;
  /** Calcium (mg). */
  calcium: number;
  /** Iron (mg). */
  iron: number;
  /** Vitamin C (mg). */
  vitc: number;
  /** "100g" or the product's serving description. */
  basis: string;
}

export type FoodSearchResult = { ok: true; items: FoodItem[] } | { ok: false; error: string };

const NutrimentsSchema = z.record(z.string(), z.union([z.number(), z.string()])).catch({});

const ProductSchema = z
  .object({
    product_name: z.string().optional(),
    brands: z.string().optional(),
    serving_size: z.string().optional(),
    nutriments: NutrimentsSchema.optional(),
  })
  .catch({});

const SearchResponseSchema = z.object({ products: z.array(ProductSchema).catch([]) }).catch({
  products: [],
});

const BarcodeResponseSchema = z
  .object({ status: z.number().catch(0), product: ProductSchema.optional() })
  .catch({ status: 0 });

type Product = z.infer<typeof ProductSchema>;

/** Coerces an OFF nutriment value (number or numeric string) to a safe number. */
function toNum(v: unknown): number {
  const x = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(x) ? x : 0;
}

function mapProduct(pr: Product): FoodItem {
  const nut = pr.nutriments ?? {};
  // Prefer per-serving values when the product provides them.
  const basis = nut['energy-kcal_serving'] != null ? 'serving' : '100g';
  const read = (key: string): number => toNum(nut[`${key}_${basis}`] ?? nut[`${key}_100g`]);
  const brand = pr.brands ? (pr.brands.split(',')[0] ?? '') : '';
  const name = [brand, pr.product_name].filter(Boolean).join(' · ') || pr.product_name || 'Food';
  return {
    n: name.slice(0, 60),
    kcal: Math.round(toNum(nut[`energy-kcal_${basis}`] ?? nut['energy-kcal_100g'])),
    p: Math.round(read('proteins')),
    c: Math.round(read('carbohydrates')),
    f: Math.round(read('fat')),
    fiber: Math.round(read('fiber')),
    sugar: Math.round(read('sugars')),
    sodium: Math.round(read('sodium') * 1000),
    // OFF stores these per-100g in grams; minerals/vitamins convert to mg.
    satfat: Math.round(read('saturated-fat')),
    potassium: Math.round(read('potassium') * 1000),
    calcium: Math.round(read('calcium') * 1000),
    iron: Math.round(read('iron') * 1000),
    vitc: Math.round(read('vitamin-c') * 1000),
    basis: basis === 'serving' ? (pr.serving_size ?? 'serving') : '100g',
  };
}

const isBarcode = (q: string): boolean => /^[0-9]{6,14}$/.test(q);

/**
 * Searches Open Food Facts by name, or looks up a single product by barcode if
 * the term is all digits. Empty term → empty results (no request).
 */
export async function searchFoods(term: string): Promise<FoodSearchResult> {
  const q = term.trim();
  if (!q) return { ok: true, items: [] };
  try {
    if (isBarcode(q)) {
      const data = await fetchJson(`${BASE}/api/v2/product/${q}.json?fields=${FIELDS}`);
      const parsed = BarcodeResponseSchema.parse(data);
      return parsed.status === 1 && parsed.product
        ? { ok: true, items: [mapProduct(parsed.product)] }
        : { ok: true, items: [] };
    }
    const url = `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(
      q,
    )}&search_simple=1&action=process&json=1&page_size=20&fields=${FIELDS}`;
    const data = await fetchJson(url);
    const parsed = SearchResponseSchema.parse(data);
    const items = parsed.products
      .map(mapProduct)
      .filter((x) => x.kcal > 0)
      .slice(0, 20);
    return { ok: true, items };
  } catch {
    return { ok: false, error: 'Could not reach the food database. Try again or add it manually.' };
  }
}
