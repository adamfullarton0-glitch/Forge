// Downloads the anatomical muscle-map artwork from the wger project
// (https://github.com/wger-project/wger) — a front + back "muscular system"
// figure plus per-muscle highlight overlays — into public/muscles/. These are
// licensed CC-BY-SA 3.0 (base figures originate from Wikimedia Commons); see the
// CREDITS file written below. Used to show which muscles each exercise works,
// highlighted on a real anatomical diagram.
//
// Run:  node scripts/fetch-muscle-media.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE =
  'https://raw.githubusercontent.com/wger-project/wger/master/wger/core/static/images/muscles';
const OUT = join(ROOT, 'public', 'muscles');

// wger muscle ids we map FORGE's exercises onto (1-16; 3 = serratus unused).
const IDS = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

async function grab(path, dest) {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  await writeFile(join(OUT, dest), Buffer.from(await res.arrayBuffer()));
}

async function main() {
  await mkdir(join(OUT, 'main'), { recursive: true });
  await mkdir(join(OUT, 'secondary'), { recursive: true });

  await grab('muscular_system_front.svg', 'front.svg');
  await grab('muscular_system_back.svg', 'back.svg');
  for (const id of IDS) {
    await grab(`main/muscle-${id}.svg`, `main/${id}.svg`);
    await grab(`secondary/muscle-${id}.svg`, `secondary/${id}.svg`);
  }

  await writeFile(
    join(OUT, 'CREDITS.md'),
    [
      '# Muscle diagram credits',
      '',
      'The anatomical muscle figures and per-muscle highlight overlays are from the',
      '[wger project](https://github.com/wger-project/wger), licensed',
      '**CC-BY-SA 3.0**. The base "muscular system" figures originate from',
      '[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Muscular_system.svg).',
      'Fetched by `scripts/fetch-muscle-media.mjs`.',
      '',
    ].join('\n'),
  );
  console.log(`Done: front + back + ${IDS.length} muscle overlays (main & secondary) bundled.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
