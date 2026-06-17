/**
 * Recipe data ported from the prototype: 12 featured savoury recipes, 12
 * featured breakfast/snack recipes (with hand-written steps), and ~560
 * procedurally-generated protein × base × sauce × format combinations.
 */

export interface Recipe {
  name: string;
  time: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  allergens: string[];
  ing: string[];
  goal: string[];
  desc: string;
  /** Featured recipes show first and are always unlocked. */
  featured?: boolean;
  /** Explicit meal type (breakfast/snack recipes). Otherwise inferred. */
  meal?: string;
  /** Hand-written method steps (featured recipes). */
  steps?: string[];
  tip?: string;
  /** Gradient index for the tile fallback. */
  grad?: number;
  /** Generated-recipe index + the parts it was built from (for method gen). */
  gi?: number;
  pIdx?: number;
  bIdx?: number;
  sIdx?: number;
  fmt?: string;
  /** Set on user-created recipes (carries the persisted CustomRecipe id). */
  id?: string;
  custom?: boolean;
}

/** [name, protein, carbs, fat, allergens, ingredient keywords] */
type ProteinDef = [string, number, number, number, string[], string[]];
/** [name, protein, carbs, fat, allergens, ingredient keywords] */
type BaseDef = [string, number, number, number, string[], string[]];
/** [name, allergens, ingredient keywords, fat] */
type SauceDef = [string, string[], string[], number];

export const GP: ProteinDef[] = [
  ['Chicken Breast', 36, 0, 5, [], ['chicken']],
  ['Turkey Mince', 30, 0, 9, [], ['turkey']],
  ['Lean Beef', 30, 0, 12, [], ['beef']],
  ['Salmon', 28, 0, 14, ['Fish'], ['salmon', 'fish']],
  ['Cod', 26, 0, 1, ['Fish'], ['fish']],
  ['Tuna Steak', 32, 0, 2, ['Fish'], ['tuna', 'fish']],
  ['King Prawn', 27, 0, 2, ['Shellfish'], ['prawns', 'shellfish']],
  ['Egg & Egg White', 24, 2, 12, ['Eggs'], ['eggs']],
  ['Crispy Tofu', 20, 4, 11, ['Soy'], ['tofu', 'soy']],
  ['Greek Yogurt Chicken', 38, 4, 7, ['Dairy'], ['chicken', 'yogurt']],
  ['Cottage Cheese', 25, 7, 6, ['Dairy'], ['cheese']],
  ['Pork Loin', 31, 0, 8, [], ['pork']],
  ['Tempeh', 22, 9, 12, ['Soy'], ['tempeh', 'soy']],
  ['Halloumi', 24, 3, 26, ['Dairy'], ['cheese', 'halloumi']],
];

export const GB: BaseDef[] = [
  ['White Rice', 5, 50, 1, [], ['rice']],
  ['Brown Rice', 6, 46, 2, [], ['rice']],
  ['Quinoa', 8, 39, 4, [], ['quinoa']],
  ['Sweet Potato', 3, 38, 0, [], ['sweet potato']],
  ['Pasta', 8, 56, 2, ['Gluten'], ['pasta']],
  ['Egg Noodles', 7, 50, 3, ['Gluten', 'Eggs'], ['noodles', 'eggs']],
  ['Wholemeal Wrap', 9, 40, 5, ['Gluten'], ['wrap', 'bread']],
  ['Couscous', 7, 43, 1, ['Gluten'], ['couscous']],
  ['Baby Potatoes', 3, 34, 0, [], ['potatoes']],
  ['Oats', 8, 42, 5, [], ['oats']],
];

export const GS: SauceDef[] = [
  ['Peri-Peri', [], ['spicy food', 'peppers'], 3],
  ['Teriyaki', ['Soy'], ['soy'], 3],
  ['Garlic & Herb', [], ['garlic'], 5],
  ['Smoky BBQ', [], [], 5],
  ['Mediterranean', [], ['tomatoes', 'olives'], 8],
  ['Tikka', ['Dairy'], ['spicy food', 'yogurt'], 6],
  ['Pesto', ['Nuts', 'Dairy'], ['pesto', 'nuts', 'cheese'], 12],
  ['Cajun', [], ['spicy food'], 4],
  ['Lemon Pepper', [], ['lemon'], 4],
  ['Korean BBQ', ['Soy'], ['soy', 'spicy food'], 5],
  ['Honey Mustard', [], ['mustard', 'honey'], 5],
  ['Satay', ['Nuts', 'Soy'], ['peanut', 'nuts', 'soy'], 11],
  ['Greek-Style', ['Dairy'], ['yogurt', 'cheese'], 7],
  ['Sweet Chilli', [], ['spicy food'], 5],
];

export const GF = ['Bowl', 'Traybake', 'Stir-Fry', 'Skillet'] as const;

export const GRADS: ReadonlyArray<readonly [string, string]> = [
  ['#FF9966', '#FF5E62'],
  ['#36D1DC', '#5B86E5'],
  ['#7F00FF', '#E100FF'],
  ['#11998E', '#38EF7D'],
  ['#F7971E', '#FFD200'],
  ['#FC5C7D', '#6A82FB'],
  ['#00B09B', '#96C93D'],
  ['#E55D87', '#5FC3E4'],
];

const FALLBACK_GRAD: readonly [string, string] = ['#16181f', '#23262f'];

/** A guaranteed gradient pair for any (possibly out-of-range) index. */
export function gradOf(i: number): readonly [string, string] {
  const len = GRADS.length;
  return GRADS[((i % len) + len) % len] ?? FALLBACK_GRAD;
}

const uniq = (arr: string[]): string[] => [...new Set(arr)];

/** Builds the ~560 generated recipes (14 proteins × 10 bases × 4 formats). */
function buildGenerated(): Recipe[] {
  const out: Recipe[] = [];
  GP.forEach(([pn, pp, pc, pf, pa, pi], i) => {
    GB.forEach(([bn, bp, bc, bf, ba, bi], j) => {
      for (let k = 0; k < 4; k++) {
        const sIdx = (i * 3 + j * 5 + k * 4) % GS.length;
        const s = GS[sIdx];
        if (!s) continue;
        const fmt = GF[(i + j + k) % GF.length] ?? 'Bowl';
        const P = pp + bp + 2;
        const C = pc + bc + 9;
        const F = pf + bf + s[3];
        const kcal = Math.round((P * 4 + C * 4 + F * 9) / 5) * 5;
        const goal =
          kcal < 540 && P >= 35
            ? ['lose', 'maintain']
            : kcal > 660
              ? ['gain', 'maintain']
              : ['maintain', 'lose', 'gain'];
        out.push({
          gi: out.length,
          name: `${s[0]} ${pn} ${fmt}`,
          time: `${15 + ((i + j + k) % 5) * 5} min`,
          kcal,
          p: P,
          c: C,
          f: F,
          allergens: uniq([...pa, ...ba, ...s[1]]),
          ing: uniq([...pi, ...bi, ...s[2], 'mixed greens']),
          goal,
          grad: (i * 7 + j * 3 + k) % GRADS.length,
          pIdx: i,
          bIdx: j,
          sIdx,
          fmt,
          desc: `${s[0].toLowerCase()} ${pn.toLowerCase()} served ${
            fmt === 'Bowl' ? 'over' : 'with'
          } ${bn.toLowerCase()} and greens — macro-friendly and meal-prep ready.`,
        });
      }
    });
  });
  return out;
}

export const GEN_RECIPES: Recipe[] = buildGenerated();

const FEATURED: Recipe[] = [
  {
    name: 'Chicken Burrito Bowl',
    time: '25 min',
    kcal: 620,
    p: 48,
    c: 68,
    f: 16,
    allergens: [],
    ing: ['chicken breast', 'rice', 'black beans', 'sweetcorn', 'avocado', 'tomatoes', 'lime'],
    goal: ['lose', 'maintain', 'gain'],
    desc: 'Grilled chicken over lime rice with beans, corn salsa and avocado. Meal-preps brilliantly.',
  },
  {
    name: 'Salmon, Rice & Greens',
    time: '20 min',
    kcal: 580,
    p: 42,
    c: 52,
    f: 22,
    allergens: ['Fish'],
    ing: ['salmon', 'rice', 'broccoli', 'lemon', 'garlic'],
    goal: ['lose', 'maintain'],
    desc: 'Pan-seared salmon with garlic broccoli and fluffy rice. Omega-3s plus easy macros.',
  },
  {
    name: 'Turkey Chili',
    time: '35 min',
    kcal: 480,
    p: 45,
    c: 42,
    f: 14,
    allergens: [],
    ing: ['turkey mince', 'kidney beans', 'tomatoes', 'onions', 'peppers', 'spicy food'],
    goal: ['lose', 'maintain'],
    desc: 'Lean turkey simmered with beans and smoky spices. Huge portion for the calories.',
  },
  {
    name: 'Beef Stir-Fry Noodles',
    time: '20 min',
    kcal: 650,
    p: 40,
    c: 70,
    f: 20,
    allergens: ['Gluten', 'Soy'],
    ing: ['beef strips', 'noodles', 'soy sauce', 'broccoli', 'peppers', 'ginger', 'garlic'],
    goal: ['gain', 'maintain'],
    desc: 'Fast wok-fried beef and veg in a glossy soy-ginger sauce over noodles.',
  },
  {
    name: 'Protein Pancakes',
    time: '15 min',
    kcal: 430,
    p: 35,
    c: 48,
    f: 10,
    allergens: ['Dairy', 'Gluten', 'Eggs'],
    ing: ['oats', 'eggs', 'banana', 'whey protein', 'milk'],
    goal: ['gain', 'maintain', 'lose'],
    desc: "Blender pancakes from oats, banana and whey. Tastes like a cheat meal, isn't.",
  },
  {
    name: 'Greek Yogurt Parfait',
    time: '5 min',
    kcal: 380,
    p: 32,
    c: 40,
    f: 11,
    allergens: ['Dairy', 'Gluten', 'Nuts'],
    ing: ['greek yogurt', 'berries', 'honey', 'granola', 'almonds'],
    goal: ['lose', 'maintain'],
    desc: 'Thick Greek yogurt layered with berries, honey and crunchy granola.',
  },
  {
    name: 'Tofu Veggie Curry',
    time: '30 min',
    kcal: 520,
    p: 26,
    c: 55,
    f: 22,
    allergens: ['Soy'],
    ing: ['tofu', 'coconut milk', 'spinach', 'rice', 'onions', 'spicy food'],
    goal: ['maintain', 'lose'],
    desc: 'Crispy tofu in a mild-heat coconut curry with spinach over rice. Fully plant-based.',
  },
  {
    name: 'Tuna Pasta Salad',
    time: '15 min',
    kcal: 540,
    p: 38,
    c: 58,
    f: 16,
    allergens: ['Fish', 'Gluten', 'Eggs'],
    ing: ['tuna', 'pasta', 'light mayo', 'sweetcorn', 'onions'],
    goal: ['maintain', 'gain'],
    desc: "Cold pasta tossed with tuna, corn and light mayo. The classic lifter's lunchbox.",
  },
  {
    name: 'PB Overnight Oats',
    time: '5 min + chill',
    kcal: 510,
    p: 28,
    c: 56,
    f: 19,
    allergens: ['Nuts', 'Dairy'],
    ing: ['oats', 'peanut butter', 'milk', 'banana', 'chia seeds'],
    goal: ['gain', 'maintain'],
    desc: 'Mix the night before, grab and go. Peanut butter makes it feel like dessert.',
  },
  {
    name: 'Shrimp Tacos',
    time: '20 min',
    kcal: 490,
    p: 34,
    c: 50,
    f: 16,
    allergens: ['Shellfish', 'Gluten', 'Dairy'],
    ing: ['shrimp', 'tortillas', 'cabbage', 'lime', 'yogurt sauce', 'spicy food'],
    goal: ['lose', 'maintain'],
    desc: 'Chili-lime shrimp in warm tortillas with crunchy slaw and a cool yogurt drizzle.',
  },
  {
    name: 'Egg White Veggie Omelette',
    time: '10 min',
    kcal: 320,
    p: 36,
    c: 8,
    f: 15,
    allergens: ['Eggs', 'Dairy'],
    ing: ['egg whites', 'spinach', 'mushrooms', 'cheese', 'tomatoes'],
    goal: ['lose'],
    desc: 'Fluffy high-protein omelette loaded with veg. Massive plate, tiny calories.',
  },
  {
    name: 'Chicken & Sweet Potato Traybake',
    time: '40 min',
    kcal: 560,
    p: 44,
    c: 54,
    f: 17,
    allergens: [],
    ing: ['chicken thighs', 'sweet potato', 'onions', 'peppers', 'olive oil'],
    goal: ['gain', 'maintain', 'lose'],
    desc: 'One tray, zero effort: roasted chicken with caramelised sweet potato and peppers.',
  },
];

const MEAL_RECIPES: Recipe[] = [
  {
    name: 'Protein Berry Oats',
    meal: 'breakfast',
    kcal: 420,
    p: 35,
    c: 45,
    f: 12,
    time: '10 min',
    allergens: ['Dairy', 'Gluten', 'Nuts'],
    ing: ['oats', 'whey', 'milk', 'berries', 'almond butter'],
    goal: ['lose', 'maintain', 'gain'],
    grad: 0,
    desc: 'Creamy oats whipped with whey and topped with berries — 35g of protein to start the day strong.',
    steps: [
      'Add the oats and milk to a pot and bring to a gentle simmer, stirring, for 4–5 minutes until thick and creamy.',
      'Take off the heat and let it cool for a minute, then stir the whey through (adding it off the heat keeps it smooth, not clumpy).',
      'Loosen with a splash more milk if needed.',
      'Top with the berries and a swirl of almond butter.',
    ],
  },
  {
    name: 'Greek Yogurt Power Bowl',
    meal: 'breakfast',
    kcal: 390,
    p: 32,
    c: 44,
    f: 9,
    time: '5 min',
    allergens: ['Dairy', 'Gluten'],
    ing: ['greek yogurt', 'granola', 'honey', 'blueberries', 'chia'],
    goal: ['lose', 'maintain'],
    grad: 1,
    desc: 'Thick Greek yogurt, crunchy granola and berries — no cooking, ready in five minutes.',
    steps: [
      'Spoon the Greek yogurt into a bowl.',
      'Scatter the granola and blueberries over the top.',
      'Sprinkle with chia seeds and finish with a drizzle of honey.',
    ],
  },
  {
    name: 'Three-Egg Veggie Scramble',
    meal: 'breakfast',
    kcal: 340,
    p: 28,
    c: 8,
    f: 22,
    time: '10 min',
    allergens: ['Eggs', 'Dairy'],
    ing: ['eggs', 'spinach', 'peppers', 'feta'],
    goal: ['lose', 'maintain'],
    grad: 2,
    desc: 'Soft-scrambled eggs loaded with spinach, peppers and salty feta. Low-carb and filling.',
    steps: [
      'Whisk the eggs with a pinch of salt and pepper.',
      'Soften the peppers in a non-stick pan with a little oil over medium heat, then add the spinach until it wilts.',
      'Pour in the eggs and stir gently with a spatula, pulling them off the heat while still a touch glossy.',
      'Crumble the feta over the top and serve.',
    ],
  },
  {
    name: 'Banana Protein Pancakes',
    meal: 'breakfast',
    kcal: 450,
    p: 34,
    c: 52,
    f: 10,
    time: '15 min',
    allergens: ['Eggs', 'Gluten', 'Dairy'],
    ing: ['oats', 'egg', 'banana', 'whey', 'baking powder'],
    goal: ['maintain', 'gain'],
    grad: 3,
    desc: 'Fluffy high-protein pancakes blended from oats and banana. Weekend-worthy, macro-friendly.',
    steps: [
      'Blend the oats, banana, egg, whey and baking powder into a smooth batter.',
      'Heat a non-stick pan over medium-low and add a little oil.',
      'Spoon in small rounds and cook 2 minutes until bubbles form, then flip and cook 1 minute more.',
      'Stack and top with extra banana or a few berries.',
    ],
  },
  {
    name: 'Smoked Salmon Avocado Toast',
    meal: 'breakfast',
    kcal: 430,
    p: 28,
    c: 30,
    f: 22,
    time: '10 min',
    allergens: ['Fish', 'Gluten', 'Eggs'],
    ing: ['wholegrain bread', 'smoked salmon', 'avocado', 'eggs'],
    goal: ['lose', 'maintain'],
    grad: 7,
    desc: 'Wholegrain toast piled with smashed avocado, smoked salmon and a poached egg.',
    steps: [
      'Toast the wholegrain bread.',
      'Mash the avocado with a squeeze of lemon, salt and pepper, and spread it on the toast.',
      'Poach or fry the eggs to your liking.',
      'Drape the smoked salmon over the avocado, top with the egg and a crack of black pepper.',
    ],
  },
  {
    name: 'Peanut Butter Overnight Oats',
    meal: 'breakfast',
    kcal: 470,
    p: 24,
    c: 55,
    f: 17,
    time: '5 min + chill',
    allergens: ['Gluten', 'Nuts', 'Dairy'],
    ing: ['oats', 'milk', 'chia', 'peanut butter', 'banana'],
    goal: ['maintain', 'gain'],
    grad: 4,
    desc: 'Stir it tonight, eat it tomorrow — peanut butter oats that set in the fridge overnight.',
    steps: [
      'In a jar, stir together the oats, milk, chia and peanut butter.',
      'Seal and refrigerate overnight (or at least 4 hours).',
      'In the morning, stir, loosen with a splash of milk, and top with sliced banana.',
    ],
  },
  {
    name: 'Spinach & Feta Omelette',
    meal: 'breakfast',
    kcal: 320,
    p: 26,
    c: 6,
    f: 21,
    time: '10 min',
    allergens: ['Eggs', 'Dairy'],
    ing: ['eggs', 'spinach', 'feta', 'tomato'],
    goal: ['lose', 'maintain'],
    grad: 5,
    desc: 'A classic folded omelette with wilted spinach and feta. Quick, low-carb, satisfying.',
    steps: [
      'Whisk the eggs with salt and pepper.',
      'Wilt the spinach in a non-stick pan, then pour the eggs over and let them set around the edges.',
      'Scatter feta and chopped tomato over one half.',
      'Fold the omelette over the filling and slide onto a plate.',
    ],
  },
  {
    name: 'Tropical Protein Smoothie',
    meal: 'breakfast',
    kcal: 360,
    p: 32,
    c: 46,
    f: 5,
    time: '5 min',
    allergens: ['Dairy', 'Gluten'],
    ing: ['whey', 'milk', 'banana', 'mango', 'oats'],
    goal: ['lose', 'maintain', 'gain'],
    grad: 6,
    desc: 'Banana, mango and whey blended thick — a drinkable breakfast for busy mornings.',
    steps: [
      'Add the milk, banana, mango, oats and whey to a blender.',
      'Blend until completely smooth, adding ice or more milk to reach the thickness you like.',
      'Pour and drink straight away.',
    ],
  },
  {
    name: 'Whey Protein Shake',
    meal: 'snack',
    kcal: 280,
    p: 28,
    c: 30,
    f: 4,
    time: '3 min',
    allergens: ['Dairy'],
    ing: ['whey', 'milk', 'banana'],
    goal: ['lose', 'maintain', 'gain'],
    grad: 1,
    desc: 'The classic post-workout shake — whey, milk and a banana for fast recovery carbs.',
    steps: [
      'Add the milk, whey and banana to a shaker or blender.',
      'Blend or shake until smooth.',
      'Drink within 30 minutes of training for an easy protein hit.',
    ],
  },
  {
    name: 'Cottage Cheese & Pineapple',
    meal: 'snack',
    kcal: 250,
    p: 26,
    c: 20,
    f: 7,
    time: '3 min',
    allergens: ['Dairy', 'Nuts'],
    ing: ['cottage cheese', 'pineapple', 'almonds'],
    goal: ['lose', 'maintain'],
    grad: 3,
    desc: 'High-protein cottage cheese with sweet pineapple and a few almonds for crunch.',
    steps: [
      'Spoon the cottage cheese into a bowl.',
      'Top with pineapple chunks.',
      'Scatter a few chopped almonds over for crunch.',
    ],
  },
  {
    name: 'Apple & Peanut Butter',
    meal: 'snack',
    kcal: 270,
    p: 8,
    c: 30,
    f: 14,
    time: '3 min',
    allergens: ['Nuts'],
    ing: ['apple', 'peanut butter'],
    goal: ['maintain'],
    grad: 4,
    desc: 'Crisp apple slices with peanut butter — simple, portable, satisfying.',
    steps: [
      'Core the apple and slice into wedges.',
      'Spoon the peanut butter into a small dish for dipping.',
      'Dust with a little cinnamon if you like, and eat straight away.',
    ],
  },
  {
    name: 'Greek Yogurt & Honey',
    meal: 'snack',
    kcal: 230,
    p: 20,
    c: 22,
    f: 7,
    time: '3 min',
    allergens: ['Dairy', 'Nuts'],
    ing: ['greek yogurt', 'honey', 'walnuts'],
    goal: ['lose', 'maintain'],
    grad: 2,
    desc: 'Thick Greek yogurt drizzled with honey and chopped walnuts. Protein-packed sweet fix.',
    steps: [
      'Spoon the Greek yogurt into a bowl.',
      'Drizzle with honey and scatter chopped walnuts over the top.',
      'Add a few berries for extra fibre if you have them.',
    ],
  },
].map((r) => ({ ...r, featured: true }));

/** Everything, featured first. */
export const ALL_RECIPES: Recipe[] = [
  ...MEAL_RECIPES,
  ...FEATURED.map((r, i) => ({ ...r, featured: true, grad: i % GRADS.length })),
  ...GEN_RECIPES,
];
