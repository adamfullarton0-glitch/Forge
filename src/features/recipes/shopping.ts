/**
 * Pure helpers for the shopping list. The list is a flat array of
 * `{ name, have }` items; "have" means it's already in the basket/cupboard.
 * Every function is pure and returns a new array, so the store stays
 * immutable and these are trivially unit-testable.
 */
import type { ShoppingItem } from '@/types/schemas';

/** Case-insensitive de-dup key for an ingredient name. */
const key = (s: string): string => s.trim().toLowerCase();

/**
 * Merge ingredient names into the list, de-duplicating case-insensitively and
 * preserving the `have` state of items already present. Blank names are
 * skipped. Returns how many genuinely new items were added.
 */
export function addIngredients(
  list: readonly ShoppingItem[],
  ings: readonly string[],
): { list: ShoppingItem[]; added: number } {
  const seen = new Set(list.map((i) => key(i.name)));
  const additions: ShoppingItem[] = [];
  for (const raw of ings) {
    const name = raw.trim();
    if (!name) continue;
    const k = key(name);
    if (seen.has(k)) continue;
    seen.add(k);
    additions.push({ name, have: false });
  }
  return { list: [...list, ...additions], added: additions.length };
}

/** Flip an item between "need to buy" and "got it". */
export function toggleHave(list: readonly ShoppingItem[], name: string): ShoppingItem[] {
  const k = key(name);
  return list.map((i) => (key(i.name) === k ? { ...i, have: !i.have } : i));
}

/** Remove a single item from the list. */
export function removeItem(list: readonly ShoppingItem[], name: string): ShoppingItem[] {
  const k = key(name);
  return list.filter((i) => key(i.name) !== k);
}

/** Drop every checked-off item (the "clear what I've got" action). */
export function clearHave(list: readonly ShoppingItem[]): ShoppingItem[] {
  return list.filter((i) => !i.have);
}

export interface ShoppingCounts {
  total: number;
  have: number;
  left: number;
}

export function counts(list: readonly ShoppingItem[]): ShoppingCounts {
  const have = list.reduce((n, i) => (i.have ? n + 1 : n), 0);
  return { total: list.length, have, left: list.length - have };
}

/** Items still needed first (alphabetical), then the ones already got. */
export function sortShopping(list: readonly ShoppingItem[]): ShoppingItem[] {
  return [...list].sort((a, b) => {
    if (a.have !== b.have) return a.have ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
}
