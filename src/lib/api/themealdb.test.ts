import { describe, it, expect, vi, afterEach } from 'vitest';
import { searchMeals, fetchNamedThumbs } from './themealdb';

function stubFetch(payload: unknown, ok = true): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(payload) })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('searchMeals', () => {
  it('returns empty results for a blank term without hitting the network', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(await searchMeals('  ')).toEqual({ ok: true, dishes: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('maps a meal, extracting ingredients and splitting the method', async () => {
    stubFetch({
      meals: [
        {
          idMeal: '1',
          strMeal: 'Test Curry',
          strMealThumb: 'http://img/curry.jpg',
          strCategory: 'Chicken',
          strArea: 'Indian',
          strInstructions: 'Chop the onion.\nFry the spices.\nSimmer.',
          strYoutube: 'http://yt/abc',
          strIngredient1: 'Chicken',
          strMeasure1: '500g',
          strIngredient2: 'Onion',
          strMeasure2: '1',
          strIngredient3: '   ',
          strMeasure3: 'ignored',
        },
      ],
    });
    const res = await searchMeals('curry');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.dishes).toHaveLength(1);
      const d = res.dishes[0]!;
      expect(d.name).toBe('Test Curry');
      expect(d.ingredients).toEqual(['500g Chicken', '1 Onion']);
      expect(d.steps).toEqual(['Chop the onion.', 'Fry the spices.', 'Simmer.']);
      expect(d.youtube).toBe('http://yt/abc');
    }
  });

  it('returns an empty list when the API yields null meals', async () => {
    stubFetch({ meals: null });
    expect(await searchMeals('zzz')).toEqual({ ok: true, dishes: [] });
  });

  it('returns an error on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    const res = await searchMeals('chicken');
    expect(res.ok).toBe(false);
  });

  it('survives a malformed response shape', async () => {
    stubFetch('not what we expected');
    expect(await searchMeals('chicken')).toEqual({ ok: true, dishes: [] });
  });
});

describe('fetchNamedThumbs', () => {
  it('maps a keyword to its first dish thumbnail (with /medium suffix)', async () => {
    stubFetch({
      meals: [{ strMealThumb: 'http://img/burrito.jpg' }, { strMealThumb: 'http://img/x.jpg' }],
    });
    const map = await fetchNamedThumbs(['burrito']);
    expect(map['burrito']).toBe('http://img/burrito.jpg/medium');
  });

  it('omits a keyword with no match (caller falls back to a tile)', async () => {
    stubFetch({ meals: null });
    const map = await fetchNamedThumbs(['nope']);
    expect(map['nope']).toBeUndefined();
  });

  it('omits a keyword on a failing fetch rather than rejecting', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('boom'))),
    );
    const map = await fetchNamedThumbs(['curry']);
    expect(map).toEqual({});
  });
});
