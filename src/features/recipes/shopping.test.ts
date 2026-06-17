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
