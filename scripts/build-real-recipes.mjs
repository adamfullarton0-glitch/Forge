// Builds FORGE's recipe library from TheMealDB's full catalogue of real, popular
// dishes — every recipe is a genuine named dish with its own real photo, real
// ingredients and real method. Writes src/features/recipes/real-recipes.json.
//
// TheMealDB is free to use (https://www.themealdb.com); photos are served from
// their CDN (hotlinked + runtime-cached), so we don't re-host 600+ images.
//
// Real recipe databases carry no nutrition, so macros are ESTIMATED from the
// ingredients via a per-100g table + a measure→grams parser, divided by an
// assumed 4 servings. They're labelled as estimates in the UI.
//
// Run on a machine with internet:  node scripts/build-real-recipes.mjs

import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://www.themealdb.com/api/json/v1/1';
const SERVINGS = 4;

// --- Nutrition: per-100g [kcal, protein, carbs, fat] for raw ingredient amounts.
const N = {
  // meats / proteins
  chicken: [200, 27, 0, 10], 'chicken breast': [165, 31, 0, 3.6],
  'chicken thigh': [209, 26, 0, 11], 'minced beef': [250, 26, 0, 15], beef: [250, 26, 0, 15],
  steak: [271, 25, 0, 19], pork: [242, 27, 0, 14], 'pork mince': [263, 17, 0, 21],
  bacon: [541, 37, 1, 42], ham: [145, 21, 1, 6], lamb: [294, 25, 0, 21],
  'lamb mince': [282, 17, 0, 23], turkey: [189, 29, 0, 7], sausage: [300, 18, 2, 25],
  salmon: [208, 20, 0, 13], tuna: [132, 28, 0, 1], cod: [90, 20, 0, 1],
  haddock: [90, 20, 0, 1], 'white fish': [90, 20, 0, 1], fish: [110, 21, 0, 2],
  prawns: [99, 24, 0, 0.3], shrimp: [99, 24, 0, 0.3], egg: [143, 13, 1, 10],
  eggs: [143, 13, 1, 10], tofu: [76, 8, 2, 4.8], chorizo: [455, 24, 2, 38],
  duck: [337, 19, 0, 28], mince: [250, 26, 0, 15],
  // dairy
  milk: [47, 3.4, 5, 1.5], butter: [717, 0.9, 0.1, 81], cheese: [402, 25, 1.3, 33],
  'cheddar cheese': [402, 25, 1.3, 33], parmesan: [431, 38, 4, 29], mozzarella: [280, 28, 3, 17],
  cream: [340, 2, 3, 36], 'double cream': [449, 2, 3, 48], 'sour cream': [198, 2, 5, 19],
  yogurt: [97, 9, 4, 5], 'greek yogurt': [97, 9, 4, 5], feta: [264, 14, 4, 21],
  'creme fraiche': [380, 2, 3, 40], 'cream cheese': [342, 6, 4, 34],
  // carbs / grains / starches
  rice: [360, 7, 79, 0.6], 'basmati rice': [360, 7, 79, 0.6], pasta: [371, 13, 75, 1.5],
  spaghetti: [371, 13, 75, 1.5], noodles: [138, 5, 25, 2], flour: [364, 10, 76, 1],
  'plain flour': [364, 10, 76, 1], bread: [265, 9, 49, 3.2], breadcrumbs: [395, 13, 72, 5],
  potatoes: [77, 2, 17, 0.1], potato: [77, 2, 17, 0.1], 'sweet potato': [86, 1.6, 20, 0.1],
  oats: [389, 17, 66, 7], couscous: [376, 13, 77, 0.6], quinoa: [368, 14, 64, 6],
  tortilla: [310, 8, 50, 8], 'puff pastry': [551, 7, 45, 38], 'sugar': [387, 0, 100, 0],
  'caster sugar': [387, 0, 100, 0], 'brown sugar': [380, 0, 98, 0], honey: [304, 0.3, 82, 0],
  // veg / fruit (low cal)
  onion: [40, 1.1, 9, 0.1], 'red onion': [40, 1.1, 9, 0.1], 'spring onions': [32, 1.8, 7, 0.2],
  garlic: [149, 6, 33, 0.5], tomato: [18, 0.9, 3.9, 0.2], tomatoes: [18, 0.9, 3.9, 0.2],
  'chopped tomatoes': [32, 1.6, 7, 0.3], carrots: [41, 0.9, 10, 0.2], carrot: [41, 0.9, 10, 0.2],
  pepper: [31, 1, 6, 0.3], 'red pepper': [31, 1, 6, 0.3], peppers: [31, 1, 6, 0.3],
  spinach: [23, 2.9, 3.6, 0.4], broccoli: [34, 2.8, 7, 0.4], mushrooms: [22, 3.1, 3.3, 0.3],
  peas: [81, 5, 14, 0.4], celery: [16, 0.7, 3, 0.2], cucumber: [15, 0.7, 3.6, 0.1],
  lettuce: [15, 1.4, 2.9, 0.2], courgette: [17, 1.2, 3.1, 0.3], aubergine: [25, 1, 6, 0.2],
  cabbage: [25, 1.3, 6, 0.1], 'green beans': [31, 1.8, 7, 0.2], corn: [86, 3.2, 19, 1.2],
  avocado: [160, 2, 9, 15], lemon: [29, 1.1, 9, 0.3], lime: [30, 0.7, 11, 0.2],
  apple: [52, 0.3, 14, 0.2], banana: [89, 1.1, 23, 0.3], 'coconut milk': [230, 2.3, 6, 24],
  // pantry / fats / sauces
  oil: [884, 0, 0, 100], 'olive oil': [884, 0, 0, 100], 'vegetable oil': [884, 0, 0, 100],
  'sunflower oil': [884, 0, 0, 100], 'soy sauce': [53, 8, 5, 0], 'tomato puree': [82, 4, 19, 0.5],
  'tomato paste': [82, 4, 19, 0.5], stock: [4, 0.3, 0.5, 0.1], wine: [83, 0.1, 2.6, 0],
  'red wine': [85, 0.1, 2.6, 0], coconut: [354, 3.3, 15, 33], peanuts: [567, 26, 16, 49],
  almonds: [579, 21, 22, 50], 'peanut butter': [588, 25, 20, 50], chocolate: [546, 5, 61, 31],
  'dark chocolate': [546, 5, 61, 31], chickpeas: [164, 9, 27, 2.6], 'kidney beans': [127, 9, 23, 0.5],
  lentils: [116, 9, 20, 0.4], 'black beans': [132, 9, 24, 0.5], raisins: [299, 3, 79, 0.5],
};

// keyword fallbacks when an exact ingredient isn't in the table
const KEYWORDS = [
  ['oil', 'oil'], ['butter', 'butter'], ['cheese', 'cheese'], ['cream', 'cream'],
  ['chicken', 'chicken'], ['beef', 'beef'], ['steak', 'steak'], ['pork', 'pork'],
  ['bacon', 'bacon'], ['lamb', 'lamb'], ['sausage', 'sausage'], ['turkey', 'turkey'],
  ['salmon', 'salmon'], ['tuna', 'tuna'], ['prawn', 'prawns'], ['shrimp', 'shrimp'],
  ['fish', 'fish'], ['cod', 'cod'], ['egg', 'egg'], ['tofu', 'tofu'], ['flour', 'flour'],
  ['rice', 'rice'], ['pasta', 'pasta'], ['noodle', 'noodles'], ['bread', 'bread'],
  ['potato', 'potatoes'], ['sugar', 'sugar'], ['honey', 'honey'], ['onion', 'onion'],
  ['garlic', 'garlic'], ['tomato', 'tomato'], ['carrot', 'carrots'], ['pepper', 'pepper'],
  ['mushroom', 'mushrooms'], ['spinach', 'spinach'], ['milk', 'milk'], ['yogurt', 'yogurt'],
  ['bean', 'kidney beans'], ['lentil', 'lentils'], ['chocolate', 'chocolate'],
  ['nut', 'almonds'], ['wine', 'wine'], ['stock', 'stock'], ['soy', 'soy sauce'],
  ['coconut', 'coconut milk'],
];

const DEFAULT_N = [120, 5, 12, 5]; // unknown ingredient, per 100g

// per-item gram weights for count-only measures ("2 onions")
const ITEM_G = {
  egg: 50, eggs: 50, onion: 150, garlic: 4, 'garlic clove': 4, clove: 4, tomato: 120,
  potato: 150, carrot: 60, pepper: 120, lemon: 60, lime: 45, apple: 180, banana: 120,
  chicken: 150, 'chicken breast': 170, 'chicken thigh': 120, sausage: 60, slice: 25,
};

function macroFor(name) {
  const k = name.toLowerCase().replace(/[^a-z ]/g, '').trim();
  if (N[k]) return N[k];
  for (const [kw, key] of KEYWORDS) if (k.includes(kw)) return N[key];
  return DEFAULT_N;
}

const FRAC = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.333, '⅔': 0.667, '⅛': 0.125 };

function qty(measure) {
  let s = measure.toLowerCase().trim();
  for (const [u, v] of Object.entries(FRAC)) s = s.replace(u, ` ${v}`);
  // "1 1/2" or "1/2" or "1.5" or "2"
  const m = s.match(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/);
  if (!m) return null;
  let n;
  if (m[1].includes('/')) {
    const parts = m[1].trim().split(/\s+/);
    const frac = parts.pop().split('/');
    n = (parts.length ? Number(parts[0]) : 0) + Number(frac[0]) / Number(frac[1]);
  } else n = Number(m[1]);
  return { n, rest: s.slice(m.index + m[1].length) };
}

const UNIT_G = {
  kg: 1000, g: 1, gram: 1, grams: 1, lb: 454, lbs: 454, pound: 454, pounds: 454, oz: 28,
  l: 1000, ml: 1, litre: 1000, liter: 1000, cup: 180, cups: 180,
  tbsp: 15, tbs: 15, tbls: 15, tblsp: 15, tablespoon: 15, tablespoons: 15,
  tsp: 5, tsps: 5, teaspoon: 5, teaspoons: 5, dsp: 10, dessertspoon: 10,
  clove: 4, cloves: 4, can: 200, cans: 200, tin: 200, tins: 200, jar: 200,
  slice: 25, slices: 25, pinch: 1, dash: 1, handful: 30, sprig: 2, sprigs: 2,
  bunch: 50, knob: 15, stick: 110, sheet: 45, sheets: 45,
};

// ingredients that are genuinely counted as whole items
const COUNTABLE = ['egg', 'onion', 'potato', 'tomato', 'carrot', 'pepper', 'lemon',
  'lime', 'apple', 'banana', 'clove', 'chicken', 'sausage', 'fillet', 'shallot'];

/** Estimate grams for an ingredient given its measure string. */
function gramsFor(ingredient, measure) {
  if (!measure || /to taste|to serve|garnish/i.test(measure)) return 5;
  const q = qty(measure);
  if (!q) return /salt|pepper|spice|herb|seasoning/i.test(ingredient) ? 3 : 20;
  const rest = q.rest.trim();
  for (const [u, g] of Object.entries(UNIT_G)) {
    if (new RegExp(`(^|[^a-z])${u}([^a-z]|$)`).test(rest)) return q.n * g;
  }
  // a number with no recognised unit → a count of whole items (eggs, onions…),
  // else a small amount (it's usually a spoon-ish measure written loosely).
  const key = ingredient.toLowerCase().replace(/[^a-z ]/g, '').trim();
  let per = ITEM_G[key];
  if (per == null) {
    const kw = COUNTABLE.find((w) => key.includes(w));
    per = kw ? (ITEM_G[kw] ?? 80) : 20;
  }
  return q.n * per;
}

const ALLERGEN_RULES = [
  ['Fish', /salmon|tuna|cod|haddock|anchov|fish sauce|\bfish\b/],
  ['Shellfish', /prawn|shrimp|crab|lobster|mussel|clam|squid|scampi/],
  ['Dairy', /milk|butter|cheese|cream|yogurt|yoghurt|ghee|paneer/],
  ['Eggs', /\begg/],
  ['Gluten', /flour|bread|pasta|noodle|spaghetti|couscous|barley|pastry|breadcrumb|tortilla|bun/],
  ['Nuts', /almond|walnut|cashew|pecan|hazelnut|peanut|pistachio/],
  ['Soy', /soy|tofu|edamame|miso/],
];

function allergensFor(ings) {
  const blob = ings.join(' ').toLowerCase();
  return ALLERGEN_RULES.filter(([, re]) => re.test(blob)).map(([a]) => a);
}

const CAT_MEAL = { Breakfast: 'breakfast', Dessert: 'snack', Starter: 'snack', Side: 'snack' };
const str = (v) => (typeof v === 'string' ? v : '');

function toRecipe(m, idx) {
  const ings = [];
  const ingNames = [];
  for (let i = 1; i <= 20; i++) {
    const ing = str(m[`strIngredient${i}`]).trim();
    const meas = str(m[`strMeasure${i}`]).trim();
    if (!ing) continue;
    ingNames.push(ing);
    ings.push(meas ? `${meas} ${ing}`.trim() : ing);
  }
  const cat = str(m.strCategory);
  // sensible serving counts: a whole cake/tart feeds more than a curry
  const servings = cat === 'Dessert' ? 8 : cat === 'Breakfast' ? 2 : SERVINGS;
  let kcal = 0, p = 0, c = 0, f = 0;
  for (let i = 1; i <= 20; i++) {
    const ing = str(m[`strIngredient${i}`]).trim();
    if (!ing) continue;
    const g = Math.min(gramsFor(ing, str(m[`strMeasure${i}`])), 1500);
    const [k, pp, cc, ff] = macroFor(ing);
    kcal += (g / 100) * k; p += (g / 100) * pp; c += (g / 100) * cc; f += (g / 100) * ff;
  }
  // Per-serving raw estimate, then a soft compression of the long tail into a
  // believable per-serving band (these are estimates) — macros scale with it so
  // the composition stays coherent (≈4·P + 4·C + 9·F).
  const raw = kcal / servings;
  let adj = raw > 800 ? 800 + (raw - 800) * 0.45 : raw;
  adj = Math.min(1300, Math.max(160, adj));
  const factor = raw > 0 ? adj / raw : 1;
  kcal = Math.round(adj / 5) * 5;
  p = Math.max(2, Math.round((p / servings) * factor));
  c = Math.max(2, Math.round((c / servings) * factor));
  f = Math.max(1, Math.round((f / servings) * factor));

  const steps = str(m.strInstructions)
    .split(/\r?\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z])/))
    .map((s) => s.replace(/^\s*(STEP\s*\d+[:.]?)/i, '').trim())
    .filter((s) => s.length > 8);

  const area = str(m.strArea);
  const meal = CAT_MEAL[cat] ?? null;
  const time = `${Math.min(90, 20 + steps.length * 5)} min`;
  const goal =
    kcal < 540 && p >= 30 ? ['lose', 'maintain'] : kcal > 720 ? ['gain', 'maintain'] : ['maintain', 'lose', 'gain'];

  return {
    name: str(m.strMeal),
    time,
    kcal, p, c, f,
    allergens: allergensFor(ingNames),
    ing: ings,
    goal,
    desc: `A ${area ? `${area} ` : ''}${cat.toLowerCase()} classic${area ? ` — a popular ${area} dish` : ''}.`,
    steps,
    cat,
    area,
    ...(meal ? { meal } : {}),
    thumb: `${str(m.strMealThumb)}/medium`,
    yt: str(m.strYoutube) || undefined,
    gi: idx,
    grad: idx % 8,
  };
}

async function main() {
  const letters = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
  const byId = new Map();
  for (const ch of letters) {
    const res = await fetch(`${API}/search.php?f=${ch}`);
    if (!res.ok) continue;
    const data = await res.json();
    for (const m of data.meals ?? []) byId.set(m.idMeal, m);
  }
  const meals = [...byId.values()].sort((a, b) => a.strMeal.localeCompare(b.strMeal));
  const recipes = meals.map((m, i) => toRecipe(m, i));

  await writeFile(
    join(ROOT, 'src', 'features', 'recipes', 'real-recipes.json'),
    JSON.stringify(recipes) + '\n',
  );

  // Sanity report
  const k = recipes.map((r) => r.kcal).sort((a, b) => a - b);
  console.log(`Built ${recipes.length} real recipes.`);
  console.log(`kcal median ${k[Math.floor(k.length / 2)]}, min ${k[0]}, max ${k[k.length - 1]}`);
  for (const name of ['Beef and Mustard Pie', 'Greek Salad', 'Spaghetti Bolognese', 'Apple Frangipan Tart']) {
    const r = recipes.find((x) => x.name === name);
    if (r) console.log(`  ${name}: ${r.kcal}kcal P${r.p} C${r.c} F${r.f} · ${r.cat}/${r.area} · ${r.steps.length} steps`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
