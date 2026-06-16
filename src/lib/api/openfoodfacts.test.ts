import { describe, it, expect, vi, afterEach } from 'vitest';
import { searchFoods } from './openfoodfacts';

function stubFetch(payload: unknown, ok = true): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(payload) })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('searchFoods', () => {
  it('returns empty results for a blank term without hitting the network', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await searchFoods('   ');
    expect(res).toEqual({ ok: true, items: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('maps search results and drops zero-calorie products', async () => {
    stubFetch({
      products: [
        {
          product_name: 'Oats',
          brands: 'Quaker, Other',
          nutriments: {
            'energy-kcal_100g': 389,
            proteins_100g: 13,
            carbohydrates_100g: 66,
            fat_100g: 7,
            fiber_100g: 10,
            sugars_100g: 1,
            sodium_100g: 0.01,
          },
        },
        { product_name: 'Water', nutriments: { 'energy-kcal_100g': 0 } },
      ],
    });
    const res = await searchFoods('oats');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.items).toHaveLength(1);
      const item = res.items[0]!;
      expect(item.n).toBe('Quaker · Oats'); // only the first brand
      expect(item.kcal).toBe(389);
      expect(item.p).toBe(13);
      expect(item.sodium).toBe(10); // 0.01 g -> 10 mg
      expect(item.basis).toBe('100g');
    }
  });

  it('looks up a single product by barcode and prefers per-serving values', async () => {
    stubFetch({
      status: 1,
      product: {
        product_name: 'Cola',
        brands: 'BrandCo',
        serving_size: '330 ml',
        nutriments: {
          'energy-kcal_serving': 139,
          'energy-kcal_100g': 42,
          proteins_serving: 0,
          carbohydrates_serving: 35,
          fat_serving: 0,
        },
      },
    });
    const res = await searchFoods('5449000000996');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.items).toHaveLength(1);
      const item = res.items[0]!;
      expect(item.kcal).toBe(139); // serving value, not 100g
      expect(item.c).toBe(35);
      expect(item.basis).toBe('330 ml');
    }
  });

  it('returns empty when a barcode is not found (status 0)', async () => {
    stubFetch({ status: 0 });
    const res = await searchFoods('0000000000000');
    expect(res).toEqual({ ok: true, items: [] });
  });

  it('coerces numeric strings and tolerates a malformed product', async () => {
    stubFetch({
      products: [
        { product_name: 'Bar', nutriments: { 'energy-kcal_100g': '250', proteins_100g: '20' } },
        'not an object',
        { nutriments: null },
      ],
    });
    const res = await searchFoods('bar');
    expect(res.ok).toBe(true);
    if (res.ok) {
      // Only the first product has calories; the junk entries are coerced/dropped.
      expect(res.items).toHaveLength(1);
      expect(res.items[0]!.kcal).toBe(250);
      expect(res.items[0]!.p).toBe(20);
    }
  });

  it('returns an error result on a network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    const res = await searchFoods('chicken');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/food database/i);
  });

  it('returns an error result on a non-200 response', async () => {
    stubFetch({}, false);
    const res = await searchFoods('chicken');
    expect(res.ok).toBe(false);
  });

  it('survives a completely malformed JSON shape', async () => {
    stubFetch('totally not the expected shape');
    const res = await searchFoods('chicken');
    expect(res).toEqual({ ok: true, items: [] });
  });
});
