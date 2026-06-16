/** Nutrition constants ported from the prototype. */

export const ALLERGENS = ['Dairy', 'Gluten', 'Eggs', 'Nuts', 'Fish', 'Shellfish', 'Soy'] as const;

export const DISLIKE_CHIPS = [
  'Mushrooms',
  'Onions',
  'Tomatoes',
  'Spicy food',
  'Avocado',
  'Beans',
  'Broccoli',
  'Banana',
  'Peppers',
  'Coconut',
  'Fish',
  'Tofu',
] as const;

export interface QuickFood {
  n: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
}

/** One-tap common foods for the Eat log. */
export const QUICK_FOODS: readonly QuickFood[] = [
  { n: 'Chicken breast (150g)', kcal: 248, p: 47, c: 0, f: 5 },
  { n: 'Rice, cooked (200g)', kcal: 260, p: 5, c: 56, f: 1 },
  { n: 'Whole eggs (2)', kcal: 156, p: 13, c: 1, f: 11 },
  { n: 'Whey protein (1 scoop)', kcal: 120, p: 24, c: 3, f: 2 },
  { n: 'Banana', kcal: 105, p: 1, c: 27, f: 0 },
  { n: 'Oats (50g)', kcal: 190, p: 7, c: 32, f: 4 },
  { n: 'Peanut butter (1 tbsp)', kcal: 95, p: 4, c: 3, f: 8 },
  { n: 'Greek yogurt (170g)', kcal: 100, p: 17, c: 6, f: 1 },
];
