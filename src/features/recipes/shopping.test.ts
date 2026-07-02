import { describe, it, expect } from 'vitest';
import {
  addIngredients,
  toggleHave,
  removeItem,
  clearHave,
  counts,
  sortShopping,
} from './shopping';
import type { ShoppingItem } from '@/types/schemas';

const item = (name: string, have = false): ShoppingItem => ({ name, have });

describe('addIngredients', () => {
  it('adds new ingredients as un-bought items', () => {
    const { list, added } = addIngredients([], ['Chicken', 'Rice']);
    expect(added).toBe(2);
    expect(list).toEqual([item('Chicken'), item('Rice')]);
  });

  it('de-duplicates case-insensitively and preserves existing state', () => {
    const start = [item('chicken', true)];
    const { list, added } = addIngredients(start, ['Chicken', 'rice']);
    expect(added).toBe(1);
    expect(list).toContainEqual(item('chicken', true)); // kept its "have" flag
    expect(list).toContainEqual(item('rice'));
    expect(list).toHaveLength(2);
  });

  it('skips blank names', () => {
    const { list, added } = addIngredients([], ['  ', '', 'Eggs']);
    expect(added).toBe(1);
    expect(list).toEqual([item('Eggs')]);
  });
});

describe('toggleHave', () => {
  it('flips the have flag for the matching item only', () => {
    const list = toggleHave([item('Rice'), item('Eggs')], 'rice');
    expect(list).toContainEqual(item('Rice', true));
    expect(list).toContainEqual(item('Eggs', false));
  });
});

describe('removeItem', () => {
  it('removes the named item', () => {
    expect(removeItem([item('Rice'), item('Eggs')], 'Rice')).toEqual([item('Eggs')]);
  });
});

describe('clearHave', () => {
  it('drops only the checked-off items', () => {
    const list = clearHave([item('Rice', true), item('Eggs', false)]);
    expect(list).toEqual([item('Eggs', false)]);
  });
});

describe('counts', () => {
  it('tallies total / have / left', () => {
    expect(counts([item('a', true), item('b', false), item('c', false)])).toEqual({
      total: 3,
      have: 1,
      left: 2,
    });
  });
});

describe('sortShopping', () => {
  it('puts needed items first, then alphabetises within each group', () => {
    const sorted = sortShopping([
      item('Zucchini', false),
      item('Apple', true),
      item('Banana', false),
    ]);
    expect(sorted.map((i) => i.name)).toEqual(['Banana', 'Zucchini', 'Apple']);
  });

  it('does not mutate the input', () => {
    const input = [item('b'), item('a')];
    sortShopping(input);
    expect(input.map((i) => i.name)).toEqual(['b', 'a']);
  });
});

describe('quantity-aware dedup', () => {
  it('merges the same ingredient across quantity formats', () => {
    const { list, added } = addIngredients(
      [{ name: 'chicken breast', have: false }],
      ['2 Chicken Breasts', '1 Chicken Breast'],
    );
    expect(added).toBe(0);
    expect(list).toHaveLength(1);
  });

  it('strips measure words and leading amounts', () => {
    const { list } = addIngredients([], ['4 tbsp Sour Cream', '250g Cheese', '4 leaves Lettuce']);
    expect(list.map((i) => i.name)).toEqual([
      '4 tbsp Sour Cream',
      '250g Cheese',
      '4 leaves Lettuce',
    ]);
    // Re-adding the bare names is a no-op — they normalise to the same keys.
    const again = addIngredients(list, ['sour cream', 'cheese', 'lettuce']);
    expect(again.added).toBe(0);
  });

  it('does not mangle names that merely start with a digit-word', () => {
    const { list } = addIngredients([], ['7-grain bread']);
    const again = addIngredients(list, ['grain bread']);
    // "7-grain bread" is a different product from "grain bread".
    expect(again.added).toBe(1);
  });
});
