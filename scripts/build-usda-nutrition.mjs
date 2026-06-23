// Builds a compact, offline nutrition lookup from USDA FoodData Central's
// SR Legacy dataset (public domain, CC0 — https://fdc.nal.usda.gov). Output:
// scripts/data/usda-foods.json — [{ d: description, n: [kcal,P,C,F per 100g] }].
//
// No API key or rate limit: we download the public bulk CSV once and parse it.
// Run:  node scripts/build-usda-nutrition.mjs
// Requires `unzip` on PATH for extraction.

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ZIP_URL =
  'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip';
const WORK = join(tmpdir(), 'forge-usda');
const SUB = 'FoodData_Central_sr_legacy_food_csv_2018-04';

// Nutrient ids in the SR Legacy `nutrient` table.
const KCAL = '1008', PROTEIN = '1003', FAT = '1004', CARB = '1005';

/** Minimal CSV line parser (handles quoted fields with commas). */
function parseLine(line) {
  const out = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

async function main() {
  await mkdir(WORK, { recursive: true });
  const dir = join(WORK, SUB);
  if (!existsSync(join(dir, 'food.csv'))) {
    console.log('Downloading USDA SR Legacy dataset…');
    const res = await fetch(ZIP_URL);
    if (!res.ok) throw new Error(`download failed ${res.status}`);
    const zip = join(WORK, 'sr.zip');
    await writeFile(zip, Buffer.from(await res.arrayBuffer()));
    execFileSync('unzip', ['-o', '-q', zip, '-d', WORK]);
  }

  // food.csv → fdc_id → description
  const foodCsv = (await readFile(join(dir, 'food.csv'), 'utf8')).split(/\r?\n/);
  const desc = new Map();
  for (let i = 1; i < foodCsv.length; i++) {
    if (!foodCsv[i]) continue;
    const f = parseLine(foodCsv[i]);
    desc.set(f[0], f[2]);
  }

  // food_nutrient.csv (36 MB) → fdc_id → { kcal, p, c, f }
  const fn = (await readFile(join(dir, 'food_nutrient.csv'), 'utf8')).split(/\r?\n/);
  const macros = new Map();
  for (let i = 1; i < fn.length; i++) {
    if (!fn[i]) continue;
    const r = parseLine(fn[i]);
    const id = r[1], nut = r[2], amt = parseFloat(r[3]);
    if (!Number.isFinite(amt)) continue;
    if (nut !== KCAL && nut !== PROTEIN && nut !== FAT && nut !== CARB) continue;
    const m = macros.get(id) ?? {};
    if (nut === KCAL) m.k = amt;
    else if (nut === PROTEIN) m.p = amt;
    else if (nut === FAT) m.f = amt;
    else if (nut === CARB) m.c = amt;
    macros.set(id, m);
  }

  const foods = [];
  for (const [id, m] of macros) {
    const d = desc.get(id);
    if (!d || m.k == null || m.p == null || m.c == null || m.f == null) continue;
    foods.push({ d, n: [Math.round(m.k), +m.p.toFixed(1), +m.c.toFixed(1), +m.f.toFixed(1)] });
  }

  await mkdir(join(ROOT, 'scripts', 'data'), { recursive: true });
  await writeFile(join(ROOT, 'scripts', 'data', 'usda-foods.json'), JSON.stringify(foods));
  console.log(`Wrote ${foods.length} USDA foods with full macros.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
