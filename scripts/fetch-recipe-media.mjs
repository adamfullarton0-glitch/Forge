// Searches each of FORGE's hand-written featured / breakfast / snack recipes up
// by name on Openverse (https://openverse.org — Creative Commons & public-domain
// image search) and bundles the best matching, openly-licensed photo into
// public/recipes/<slug>.jpg, then writes:
//   - src/features/recipes/recipe-media.json   (manifest: slugs that have a photo)
//   - public/recipes/CREDITS.md                (required CC-BY attribution)
//
// This is the legally-clean equivalent of "search each recipe on Google and use
// a matching picture": we only take results filtered to commercial-use +
// modification licences (CC0 / public domain / CC-BY …), and we ship the
// attribution, so the photos can be bundled in the app. Arbitrary Google Images
// results are copyrighted and can't be re-hosted; these can.
//
// Run on a machine with internet:  node scripts/fetch-recipe-media.mjs
// Then commit public/recipes/*.jpg, CREDITS.md, and recipe-media.json.
//
// Safe to re-run (idempotent). Prints a report so you can tune QUERIES below.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.openverse.org/v1/images/';
const UA = 'forge-recipe-fetch (https://github.com/adamfullarton0-glitch/forge)';

// FORGE's hand-written recipes (keep names in sync with
// src/features/recipes/data.ts FEATURED + MEAL_RECIPES). Each maps to a clean
// food-search phrase; ordered fallbacks are tried if the first finds nothing.
const QUERIES = [
  // Breakfast / snack
  ['Protein Berry Oats', ['berry oatmeal bowl', 'berry oats']],
  ['Greek Yogurt Power Bowl', ['greek yogurt bowl', 'yogurt fruit bowl']],
  ['Three-Egg Veggie Scramble', ['egg scramble vegetables', 'scrambled eggs']],
  ['Banana Protein Pancakes', ['banana pancakes', 'pancakes banana']],
  ['Smoked Salmon Avocado Toast', ['smoked salmon avocado toast', 'avocado toast']],
  ['Peanut Butter Overnight Oats', ['peanut butter overnight oats', 'overnight oats']],
  ['Spinach & Feta Omelette', ['spinach feta omelette', 'omelette']],
  ['Tropical Protein Smoothie', ['tropical smoothie', 'mango smoothie']],
  ['Whey Protein Shake', ['protein shake', 'milkshake glass']],
  ['Cottage Cheese & Pineapple', ['cottage cheese pineapple', 'cottage cheese fruit']],
  ['Apple & Peanut Butter', ['apple slices peanut butter', 'apple peanut butter']],
  ['Greek Yogurt & Honey', ['greek yogurt honey', 'yogurt honey walnuts']],
  // Featured savoury
  ['Chicken Burrito Bowl', ['chicken burrito bowl', 'burrito bowl']],
  ['Salmon, Rice & Greens', ['salmon rice vegetables', 'salmon rice']],
  ['Turkey Chili', ['turkey chili', 'chili bowl']],
  ['Beef Stir-Fry Noodles', ['beef noodle stir fry', 'beef noodles']],
  ['Protein Pancakes', ['pancakes stack', 'pancakes']],
  ['Greek Yogurt Parfait', ['yogurt parfait', 'yogurt granola parfait']],
  ['Tofu Veggie Curry', ['tofu vegetable curry', 'tofu curry']],
  ['Tuna Pasta Salad', ['tuna pasta salad', 'pasta salad']],
  ['PB Overnight Oats', ['overnight oats jar', 'overnight oats']],
  ['Shrimp Tacos', ['shrimp tacos', 'prawn tacos']],
  ['Egg White Veggie Omelette', ['vegetable omelette', 'omelette vegetables']],
  ['Chicken & Sweet Potato Traybake', ['roast chicken sweet potato', 'chicken traybake']],
];

// Hand-picked photos for recipes whose automatic top result was off-theme or
// unappetising (verified by eye). Each pins the exact Openverse image — we still
// fetch it through the API (by the same query) so its licence + attribution are
// captured for CREDITS.md. If the pinned URL ever drops out of the results we
// fall back to the recipe's normal QUERIES above.
const OVERRIDES = {
  'Whey Protein Shake': {
    query: 'protein shake',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Protein_shake.jpg',
  },
  'Apple & Peanut Butter': {
    query: 'apple slices peanut butter',
    url: 'https://live.staticflickr.com/84/252041504_563d2a5803_b.jpg',
  },
  'Cottage Cheese & Pineapple': {
    query: 'cottage cheese fruit bowl',
    url: 'https://live.staticflickr.com/7264/6902905454_b917b80276_b.jpg',
  },
  'Greek Yogurt & Honey': {
    query: 'greek yogurt honey walnuts bowl',
    url: 'https://live.staticflickr.com/8183/8126239113_62356264bc_b.jpg',
  },
  'Peanut Butter Overnight Oats': {
    query: 'overnight oats',
    url: 'https://live.staticflickr.com/4036/35654289166_3063f8ec2c_b.jpg',
  },
  'Chicken & Sweet Potato Traybake': {
    query: 'roast chicken thighs vegetables',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Liat_Portal_for_Foodie_Disorder_-_Grilled_Chicken_with_Roasted_Vegetables.jpg',
  },
  'Salmon, Rice & Greens': {
    query: 'grilled salmon rice broccoli plate',
    url: 'https://live.staticflickr.com/7400/13162500483_4f5617cabb.jpg',
  },
  'Shrimp Tacos': {
    query: 'shrimp tacos plate',
    url: 'https://live.staticflickr.com/7577/16322286006_7fb2476afc_b.jpg',
  },
  'Tofu Veggie Curry': {
    query: 'tofu vegetable stir fry',
    url: 'https://live.staticflickr.com/6151/6229385375_2dd3eec78c_b.jpg',
  },
  'Egg White Veggie Omelette': {
    query: 'spinach omelette plate',
    url: 'https://live.staticflickr.com/3075/2729025592_81b71b119c_b.jpg',
  },
};

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Prefer a moderately-sized image to keep the bundle lean (a 168px hero / 70px
// tile never needs a multi-MB original). Flickr static URLs end in a size suffix
// (_b = 1024 → _c = 800); Wikimedia originals are scaled via Special:FilePath.
const sized = (url) => {
  if (/staticflickr\.com\/.*_b\.jpg$/.test(url)) return url.replace(/_b\.jpg$/, '_c.jpg');
  const wiki = url.match(/upload\.wikimedia\.org\/wikipedia\/[^/]+\/(?:[0-9a-f]\/[0-9a-f]{2}\/)(.+)$/);
  if (wiki) return `https://commons.wikimedia.org/wiki/Special:FilePath/${wiki[1]}?width=1024`;
  return url;
};

async function search(query) {
  const url =
    `${API}?q=${encodeURIComponent(query)}` +
    `&license_type=commercial,modification&page_size=12&mature=false`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.results) ? data.results : [];
}

async function download(url) {
  for (const candidate of [sized(url), url]) {
    const res = await fetch(candidate, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 1024) return buf; // guard against tiny error pages
    }
  }
  return null;
}

async function main() {
  const outDir = join(ROOT, 'public', 'recipes');
  await mkdir(outDir, { recursive: true });

  // Reserve hand-picked URLs so an earlier recipe's auto-pick can't grab them.
  const used = new Set(Object.values(OVERRIDES).map((o) => o.url));
  const manifest = [];
  const credits = [];

  for (const [name, queries] of QUERIES) {
    let pick = null;
    const override = OVERRIDES[name];
    if (override) {
      const results = await search(override.query);
      pick = results.find((r) => r.url === override.url) ?? null;
    }
    for (const q of pick ? [] : queries) {
      const results = await search(q);
      pick = results.find((r) => r.url && !used.has(r.url));
      if (pick) break;
    }
    if (!pick) {
      console.warn(`✗ ${name} — no openly-licensed photo found (tune QUERIES)`);
      continue;
    }
    const buf = await download(pick.url);
    if (!buf) {
      console.warn(`✗ ${name} → "${pick.title}": download failed`);
      continue;
    }
    used.add(pick.url);
    await writeFile(join(outDir, `${slug(name)}.jpg`), buf);
    manifest.push(slug(name));
    credits.push({ name, slug: slug(name), ...pick });
    console.log(`✓ ${name} → "${pick.title ?? 'untitled'}" (${pick.license})`);
  }

  manifest.sort();
  await writeFile(
    join(ROOT, 'src', 'features', 'recipes', 'recipe-media.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );

  const md = [
    '# Recipe photo credits',
    '',
    'Recipe photos are bundled from [Openverse](https://openverse.org) under the',
    'Creative Commons / public-domain licences shown below, fetched by',
    '`scripts/fetch-recipe-media.mjs`. Attribution is provided as required.',
    '',
    ...credits.map(
      (c) =>
        `- **${c.name}** — ${c.attribution ?? `"${c.title}" by ${c.creator ?? 'unknown'} (${c.license} ${c.license_version ?? ''})`}` +
        (c.foreign_landing_url ? ` — ${c.foreign_landing_url}` : ''),
    ),
    '',
  ].join('\n');
  await writeFile(join(outDir, 'CREDITS.md'), md);

  console.log(`\nDone: ${manifest.length}/${QUERIES.length} photos bundled.`);
  console.log('Commit public/recipes/*.jpg, public/recipes/CREDITS.md, and recipe-media.json.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
