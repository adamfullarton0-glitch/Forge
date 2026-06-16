import { describe, it, expect, vi, afterEach } from 'vitest';
import { searchMeals, fetchPhotos } from './themealdb';

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

describe('fetchPhotos', () => {
  it('builds a term → thumbnail-list map (with /medium suffix)', async () => {
    stubFetch({
      meals: [{ strMealThumb: 'http://img/a.jpg' }, { strMealThumb: 'http://img/b.jpg' }],
    });
    const map = await fetchPhotos(['Chicken'], ['Salmon']);
    expect(map['Chicken']).toEqual(['http://img/a.jpg/medium', 'http://img/b.jpg/medium']);
    expect(map['Salmon']).toHaveLength(2);
  });

  it('contributes an empty list for a failing fetch rather than rejecting', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('boom'))),
    );
    const map = await fetchPhotos(['Chicken'], []);
    expect(map['Chicken']).toEqual([]);
  });

  it('handles null meals from the filter endpoint', async () => {
    stubFetch({ meals: null });
    const map = await fetchPhotos(['Beef'], []);
    expect(map['Beef']).toEqual([]);
  });
});
