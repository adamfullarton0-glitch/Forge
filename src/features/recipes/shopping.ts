/**
 * Pure helpers for the shopping list. The list is a flat array of
 * `{ name, have }` items; "have" means it's already in the basket/cupboard.
 * Every function is pure and returns a new array, so the store stays
 * immutable and these are trivially unit-testable.
 */
import type { ShoppingItem } from '@/types/schemas';

/**
 * Case-insensitive de-dup key for an ingredient name. Recipes embed quantities
 * ("2 Chicken Breasts", "250g Cheese", "4 tbsp Sour Cream") while others use
 * bare names ("chicken breast") — the key strips a leading amount + measure
 * word and a plural "s" so those all merge into one line instead of three.
 * Display names keep their original text; only comparison is normalised.
 */
const key = (s: string): string => {
  let k = s.trim().toLowerCase();
  // Leading quantity: "2 ", "1/2 ", "1.5 ", "½ ", or attached metric "250g ".
  k = k.replace(/^(?:\d+[\d.,/]*(?:g|kg|ml|l|oz)\b|\d+[\d.,/]*(?=\s)|[½¼¾⅓⅔])\s*/, '');
  // A standalone measure word left behind ("tbsp sour cream", "leaves lettuce").
  k = k.replace(
    /^(?:g|kg|ml|l|oz|lbs?|tbsps?|tsps?|cups?|cloves?|slices?|leaves|leaf|cans?|tins?|pinch(?:es)?|handfuls?)\b\.?\s+/,
    '',
  );
  k = k.replace(/^of\s+/, '');
  // Naive singular so "chicken breasts" and "chicken breast" collide.
  if (k.length > 3 && k.endsWith('s') && !k.endsWith('ss')) k = k.slice(0, -1);
  return k || s.trim().toLowerCase();
};

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
