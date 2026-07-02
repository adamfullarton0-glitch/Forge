// Downloads license-clean (public-domain) demonstration photos for FORGE's
// exercises from the free-exercise-db (https://github.com/yuhonas/free-exercise-db,
// The Unlicense) into public/exercises/<slug>.jpg, and writes the manifest
// src/features/workouts/exercise-media.json.
//
// Run on a machine with internet:  node scripts/fetch-exercise-media.mjs
// Then commit public/exercises/*.jpg and the updated manifest.
//
// It's safe to re-run (idempotent) and prints a match report so you can tweak
// the OVERRIDES below for any exercise that matched poorly.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DB = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

// FORGE's exercises (keep in sync with src/features/workouts/exercises.ts).
const EXERCISES = [
  'Barbell Bench Press',
  'Incline Dumbbell Press',
  'Overhead Press',
  'Seated Dumbbell Shoulder Press',
  'Lateral Raise',
  'Rear Delt Fly',
  'Tricep Pushdown',
  'Skullcrusher',
  'Dips',
  'Push-Up',
  'Cable Fly',
  'Deadlift',
  'Romanian Deadlift',
  'Pull-Up',
  'Lat Pulldown',
  'Barbell Row',
  'Seated Cable Row',
  'Face Pull',
  'Barbell Shrug',
  'Barbell Curl',
  'Hammer Curl',
  'Preacher Curl',
  'Barbell Back Squat',
  'Front Squat',
  'Leg Press',
  'Walking Lunge',
  'Leg Extension',
  'Lying Leg Curl',
  'Standing Calf Raise',
  'Hip Thrust',
  'Plank',
  'Goblet Squat',
  'Dumbbell Romanian Deadlift',
  'Dumbbell Bench Press',
  'Incline Barbell Press',
  'Close-Grip Bench Press',
  'Dumbbell Row',
  'T-Bar Row',
  'Bulgarian Split Squat',
  'Hack Squat',
  'Seated Calf Raise',
  'Cable Crunch',
  'Hanging Leg Raise',
  'Overhead Tricep Extension',
  'Incline Dumbbell Curl',
  'EZ Bar Curl',
  'Concentration Curl',
  'Cable Crossover',
  'Reverse Lunge',
  'Sumo Deadlift',
  "World's Greatest Stretch",
  'Standing Hip Circles',
  'Groiner Stretch',
  'Hip Flexor Stretch',
  'Lying Glute Stretch',
  'Cat-Cow Stretch',
];

// Manual hints where fuzzy matching is unreliable: FORGE name → a substring of
// the free-exercise-db exercise name to prefer.
const OVERRIDES = {
  'Barbell Bench Press': 'Barbell Bench Press - Medium Grip',
  'Overhead Press': 'Standing Military Press',
  'Lateral Raise': 'Side Lateral Raise',
  'Rear Delt Fly': 'Reverse Flyes',
  'Tricep Pushdown': 'Triceps Pushdown',
  Skullcrusher: 'Lying Triceps Press',
  Dips: 'Dips - Triceps Version',
  'Push-Up': 'Pushups',
  'Cable Fly': 'Cable Crossover',
  Deadlift: 'Barbell Deadlift',
  'Pull-Up': 'Pullups',
  'Lat Pulldown': 'Wide-Grip Lat Pulldown',
  'Barbell Row': 'Bent Over Barbell Row',
  'Seated Cable Row': 'Seated Cable Rows',
  'Barbell Back Squat': 'Barbell Squat',
  'Front Squat': 'Front Barbell Squat',
  'Incline Barbell Press': 'Barbell Incline Bench Press - Medium Grip',
  'Close-Grip Bench Press': 'Close-Grip Barbell Bench Press',
  'Dumbbell Row': 'One-Arm Dumbbell Row',
  'T-Bar Row': 'Lying T-Bar Row',
  'Bulgarian Split Squat': 'One Leg Barbell Squat',
  'Hack Squat': 'Barbell Hack Squat',
  'Seated Calf Raise': 'Seated Calf Raise',
  'Cable Crunch': 'Cable Crunch',
  'Hanging Leg Raise': 'Hanging Leg Raise',
  'Overhead Tricep Extension': 'Standing Dumbbell Triceps Extension',
  'Incline Dumbbell Curl': 'Incline Dumbbell Curl',
  'EZ Bar Curl': 'EZ-Bar Curl',
  'Concentration Curl': 'Concentration Curls',
  'Cable Crossover': 'Cable Crossover',
  'Reverse Lunge': 'Dumbbell Rear Lunge',
  'Sumo Deadlift': 'Sumo Deadlift',
  'Walking Lunge': 'Dumbbell Lunges',
  'Leg Extension': 'Leg Extensions',
  'Lying Leg Curl': 'Lying Leg Curls',
  'Standing Calf Raise': 'Standing Calf Raises',
  'Hip Thrust': 'Barbell Hip Thrust',
  'Dumbbell Romanian Deadlift': 'Romanian Deadlift',
  'Seated Dumbbell Shoulder Press': 'Seated Dumbbell Press',
  "World's Greatest Stretch": "World's Greatest Stretch",
  'Standing Hip Circles': 'Standing Hip Circles',
  'Groiner Stretch': 'Groiners',
  'Hip Flexor Stretch': 'Kneeling Hip Flexor',
  'Lying Glute Stretch': 'Lying Glute',
  'Cat-Cow Stretch': 'Cat Stretch',
};

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const tokens = (s) => new Set(norm(s).split(' ').filter(Boolean));

function score(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  let hits = 0;
  for (const t of ta) if (tb.has(t)) hits++;
  return hits / Math.max(ta.size, tb.size);
}

function bestMatch(name, db) {
  const want = OVERRIDES[name];
  if (want) {
    const exact = db.find((e) => e.name === want) ?? db.find((e) => e.name?.includes(want));
    if (exact) return exact;
  }
  let best = null;
  let bestScore = 0;
  for (const e of db) {
    const sc = score(name, e.name ?? '');
    if (sc > bestScore) {
      bestScore = sc;
      best = e;
    }
  }
  return bestScore >= 0.5 ? best : null;
}

async function main() {
  console.log('Fetching free-exercise-db index…');
  const res = await fetch(DB);
  if (!res.ok) throw new Error(`Could not fetch DB (${res.status})`);
  const db = await res.json();

  const outDir = join(ROOT, 'public', 'exercises');
  await mkdir(outDir, { recursive: true });

  const manifest = [];
  for (const name of EXERCISES) {
    const match = bestMatch(name, db);
    // free-exercise-db ships two frames per exercise: [0] start, [1] finish.
    const frames = match?.images ?? [];
    if (!match || frames.length < 2) {
      console.warn(`✗ ${name} — no match / too few frames (add an OVERRIDE)`);
      continue;
    }
    let ok = true;
    for (let i = 0; i < 2; i++) {
      const imgRes = await fetch(IMG_BASE + frames[i]);
      if (!imgRes.ok) {
        console.warn(`✗ ${name} → ${match.name}: frame ${i} ${imgRes.status}`);
        ok = false;
        break;
      }
      const buf = Buffer.from(await imgRes.arrayBuffer());
      await writeFile(join(outDir, `${slug(name)}-${i + 1}.jpg`), buf);
    }
    if (!ok) continue;
    manifest.push(slug(name));
    console.log(`✓ ${name} → ${match.name} (start + finish)`);
  }

  manifest.sort();
  await writeFile(
    join(ROOT, 'src', 'features', 'workouts', 'exercise-media.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );
  console.log(`\nDone: ${manifest.length}/${EXERCISES.length} images bundled.`);
  console.log('Commit public/exercises/*.jpg and the updated exercise-media.json.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
