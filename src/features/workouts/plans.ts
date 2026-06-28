/** Workout plans, imported program library, and equipment data. */
import { getExercise } from './exercises';
import programsRaw from './programs.json';
import type { CustomPlan } from '@/types/schemas';

export interface PlanDay {
  name: string;
  focus: string;
  /** Exercise names (keys into the exercise DB). */
  ex: string[];
}

export interface Plan {
  name: string;
  tag: string;
  desc: string;
  days: PlanDay[];
}

export const PLANS = {
  ppl: {
    name: 'Push / Pull / Legs',
    tag: '3–6 days · most popular',
    desc: 'Split by movement pattern. Run it 3 days a week or twice through for 6.',
    days: [
      {
        name: 'Push',
        focus: 'Chest, shoulders, triceps',
        ex: [
          'Barbell Bench Press',
          'Overhead Press',
          'Incline Dumbbell Press',
          'Lateral Raise',
          'Tricep Pushdown',
          'Skullcrusher',
        ],
      },
      {
        name: 'Pull',
        focus: 'Back, rear delts, biceps',
        ex: ['Deadlift', 'Pull-Up', 'Seated Cable Row', 'Face Pull', 'Barbell Curl', 'Hammer Curl'],
      },
      {
        name: 'Legs',
        focus: 'Quads, hamstrings, glutes, calves',
        ex: [
          'Barbell Back Squat',
          'Romanian Deadlift',
          'Leg Press',
          'Lying Leg Curl',
          'Standing Calf Raise',
          'Plank',
        ],
      },
    ],
  },
  ul: {
    name: 'Upper / Lower',
    tag: '4 days · balanced',
    desc: 'Each muscle twice a week with plenty of recovery. Great for strength and size.',
    days: [
      {
        name: 'Upper A',
        focus: 'Horizontal push & pull',
        ex: [
          'Barbell Bench Press',
          'Barbell Row',
          'Overhead Press',
          'Lat Pulldown',
          'Barbell Curl',
          'Tricep Pushdown',
        ],
      },
      {
        name: 'Lower A',
        focus: 'Squat focus',
        ex: [
          'Barbell Back Squat',
          'Romanian Deadlift',
          'Leg Press',
          'Lying Leg Curl',
          'Standing Calf Raise',
        ],
      },
      {
        name: 'Upper B',
        focus: 'Vertical push & pull',
        ex: [
          'Incline Dumbbell Press',
          'Pull-Up',
          'Seated Dumbbell Shoulder Press',
          'Seated Cable Row',
          'Hammer Curl',
          'Skullcrusher',
        ],
      },
      {
        name: 'Lower B',
        focus: 'Hinge focus',
        ex: ['Deadlift', 'Front Squat', 'Walking Lunge', 'Leg Extension', 'Standing Calf Raise'],
      },
    ],
  },
  bro: {
    name: 'Bro Split',
    tag: '5 days · one muscle a day',
    desc: 'Classic bodybuilding split. High volume per muscle, once a week each.',
    days: [
      {
        name: 'Chest',
        focus: 'All angles of the chest',
        ex: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Cable Fly', 'Dips', 'Push-Up'],
      },
      {
        name: 'Back',
        focus: 'Width and thickness',
        ex: ['Deadlift', 'Pull-Up', 'Barbell Row', 'Lat Pulldown', 'Face Pull'],
      },
      {
        name: 'Shoulders',
        focus: 'All three delt heads',
        ex: [
          'Overhead Press',
          'Seated Dumbbell Shoulder Press',
          'Lateral Raise',
          'Rear Delt Fly',
          'Barbell Shrug',
        ],
      },
      {
        name: 'Arms',
        focus: 'Biceps & triceps',
        ex: [
          'Barbell Curl',
          'Preacher Curl',
          'Hammer Curl',
          'Tricep Pushdown',
          'Skullcrusher',
          'Dips',
        ],
      },
      {
        name: 'Legs',
        focus: 'Full lower body',
        ex: [
          'Barbell Back Squat',
          'Romanian Deadlift',
          'Leg Press',
          'Lying Leg Curl',
          'Leg Extension',
          'Standing Calf Raise',
        ],
      },
    ],
  },
  fb: {
    name: 'Full Body',
    tag: '3 days · best for beginners',
    desc: 'Hit everything each session. Maximum results from minimum gym days.',
    days: [
      {
        name: 'Full Body A',
        focus: 'Squat + horizontal',
        ex: ['Barbell Back Squat', 'Barbell Bench Press', 'Barbell Row', 'Lateral Raise', 'Plank'],
      },
      {
        name: 'Full Body B',
        focus: 'Hinge + vertical',
        ex: ['Deadlift', 'Overhead Press', 'Pull-Up', 'Walking Lunge', 'Barbell Curl'],
      },
      {
        name: 'Full Body C',
        focus: 'Variation day',
        ex: [
          'Front Squat',
          'Incline Dumbbell Press',
          'Seated Cable Row',
          'Hip Thrust',
          'Tricep Pushdown',
        ],
      },
    ],
  },
  arnold: {
    name: 'Arnold Split',
    tag: '3 days · golden era',
    desc: "Arnold's classic pairing: chest with back, shoulders with arms, then legs. Run twice a week.",
    days: [
      {
        name: 'Chest & Back',
        focus: 'Antagonist supersets',
        ex: [
          'Barbell Bench Press',
          'Barbell Row',
          'Incline Dumbbell Press',
          'Pull-Up',
          'Cable Fly',
        ],
      },
      {
        name: 'Shoulders & Arms',
        focus: 'Delts, biceps, triceps',
        ex: ['Overhead Press', 'Lateral Raise', 'Rear Delt Fly', 'Barbell Curl', 'Skullcrusher'],
      },
      {
        name: 'Legs',
        focus: 'Quads, hams, calves',
        ex: [
          'Barbell Back Squat',
          'Romanian Deadlift',
          'Leg Press',
          'Lying Leg Curl',
          'Standing Calf Raise',
        ],
      },
    ],
  },
  phul: {
    name: 'PHUL',
    tag: '4 days · power + size',
    desc: 'Power Hypertrophy Upper Lower: two heavy strength days, two pump days. Best of both worlds.',
    days: [
      {
        name: 'Upper Power',
        focus: 'Heavy 4–6 rep work',
        ex: ['Barbell Bench Press', 'Barbell Row', 'Overhead Press', 'Pull-Up'],
      },
      {
        name: 'Lower Power',
        focus: 'Heavy 4–6 rep work',
        ex: ['Barbell Back Squat', 'Deadlift', 'Leg Press', 'Standing Calf Raise'],
      },
      {
        name: 'Upper Hypertrophy',
        focus: 'Volume 8–12 reps',
        ex: [
          'Incline Dumbbell Press',
          'Seated Cable Row',
          'Lateral Raise',
          'Barbell Curl',
          'Skullcrusher',
        ],
      },
      {
        name: 'Lower Hypertrophy',
        focus: 'Volume 8–12 reps',
        ex: [
          'Front Squat',
          'Romanian Deadlift',
          'Walking Lunge',
          'Leg Extension',
          'Lying Leg Curl',
        ],
      },
    ],
  },
  str5: {
    name: 'Strength 5×5',
    tag: '2 days · raw strength',
    desc: 'The classic beginner strength program. Two alternating workouts, 5 sets of 5 on everything, add weight every session.',
    days: [
      {
        name: 'Workout A',
        focus: 'Squat, bench, row — 5×5',
        ex: ['Barbell Back Squat', 'Barbell Bench Press', 'Barbell Row'],
      },
      {
        name: 'Workout B',
        focus: 'Squat, press, deadlift — 5×5',
        ex: ['Barbell Back Squat', 'Overhead Press', 'Deadlift'],
      },
    ],
  },
  busy2: {
    name: 'Busy 2-Day',
    tag: '2 days · minimum dose',
    desc: 'Only two free slots a week? These two full-body sessions cover every major movement.',
    days: [
      {
        name: 'Session 1',
        focus: 'Squat + push + pull',
        ex: ['Barbell Back Squat', 'Barbell Bench Press', 'Barbell Row', 'Plank'],
      },
      {
        name: 'Session 2',
        focus: 'Hinge + press + pull',
        ex: ['Deadlift', 'Overhead Press', 'Pull-Up', 'Walking Lunge'],
      },
    ],
  },
  db: {
    name: 'Dumbbell Only',
    tag: '4 days · home friendly',
    desc: 'A full upper/lower built entirely around dumbbells and a bench. Perfect for home gyms.',
    days: [
      {
        name: 'Upper A',
        focus: 'Push focus',
        ex: [
          'Incline Dumbbell Press',
          'Seated Dumbbell Shoulder Press',
          'Lateral Raise',
          'Hammer Curl',
        ],
      },
      {
        name: 'Lower A',
        focus: 'Squat + hinge',
        ex: ['Goblet Squat', 'Dumbbell Romanian Deadlift', 'Walking Lunge', 'Standing Calf Raise'],
      },
      {
        name: 'Upper B',
        focus: 'Pull + delts',
        ex: ['Push-Up', 'Rear Delt Fly', 'Seated Dumbbell Shoulder Press', 'Hammer Curl'],
      },
      {
        name: 'Lower B',
        focus: 'Volume legs',
        ex: ['Walking Lunge', 'Goblet Squat', 'Standing Calf Raise', 'Plank'],
      },
    ],
  },
  bw: {
    name: 'Bodyweight Home',
    tag: '3 days · zero equipment',
    desc: 'No gym, no problem. Just a pull-up bar (or a sturdy door frame) and the floor.',
    days: [
      {
        name: 'Home A',
        focus: 'Push + legs',
        ex: ['Push-Up', 'Walking Lunge', 'Standing Calf Raise', 'Plank'],
      },
      { name: 'Home B', focus: 'Pull + core', ex: ['Pull-Up', 'Dips', 'Plank'] },
      {
        name: 'Home C',
        focus: 'Full body burner',
        ex: ['Push-Up', 'Walking Lunge', 'Pull-Up', 'Plank'],
      },
    ],
  },
} satisfies Record<string, Plan>;

export type PlanId = keyof typeof PLANS;

export const DEFAULT_PLAN_ID: PlanId = 'ppl';

/* ── Imported program library (workout_programs.json) ──────────────────────
   A big catalogue of named programs. They're converted into FORGE's Plan shape;
   exercise names are normalised to the demo DB where an equivalent exists (so
   known moves still show a demo + muscle map), and anything novel is kept as a
   plain logged movement. Programs that duplicate a built-in plan are skipped. */
interface RawEx {
  name: string;
  sets: number;
  reps: string;
  muscles: string[];
}
interface RawProgram {
  id: string;
  name: string;
  category: string;
  goal: string;
  level: string;
  daysPerWeek: number;
  days: Array<{ name: string; exercises: RawEx[] }>;
}

/** Imported names → demo-DB exercises (case/grip/equipment variants). */
const EX_ALIAS: Record<string, string> = {
  'Pull-up': 'Pull-Up',
  'Wide-Grip Pull-up': 'Pull-Up',
  'Weighted Pull-up': 'Pull-Up',
  'Chin-up': 'Pull-Up',
  'Weighted Chin-up': 'Pull-Up',
  'Push-up': 'Push-Up',
  'Diamond Push-up': 'Push-Up',
  'Knee or Incline Push-up': 'Push-Up',
  'Pike Push-up': 'Push-Up',
  'Wall Handstand Push-up': 'Push-Up',
  'Pseudo Planche Push-up': 'Push-Up',
  'Dumbbell Lateral Raise': 'Lateral Raise',
  'Standing Lateral Raise': 'Lateral Raise',
  'Cable Lateral Raise': 'Lateral Raise',
  'Cable One Arm Lateral Raise': 'Lateral Raise',
  'Leg Curl': 'Lying Leg Curl',
  'Lever Seated Leg Curl': 'Lying Leg Curl',
  'Lever Lying Leg Curl': 'Lying Leg Curl',
  'Nordic Curl': 'Lying Leg Curl',
  'Dumbbell Shoulder Press': 'Seated Dumbbell Shoulder Press',
  'Dumbbell Seated Shoulder Press': 'Seated Dumbbell Shoulder Press',
  'Lever Seated Shoulder Press': 'Seated Dumbbell Shoulder Press',
  'Standing Overhead Press': 'Overhead Press',
  'Barbell Standing Military Press': 'Overhead Press',
  'Push Press': 'Overhead Press',
  'Kettlebell Overhead Press': 'Overhead Press',
  'Rope Pushdown': 'Tricep Pushdown',
  'Triceps Pushdown': 'Tricep Pushdown',
  'Dumbbell Overhead Tricep Extension': 'Overhead Tricep Extension',
  'Barbell Lying Triceps Extension Skull Crusher': 'Skullcrusher',
  'Lying Triceps Extension': 'Skullcrusher',
  'Weighted Dips': 'Dips',
  'Chest Dip': 'Dips',
  'Incline Bench Press': 'Incline Barbell Press',
  'Incline Smith Machine Press': 'Incline Barbell Press',
  'Smith Incline Bench Press': 'Incline Barbell Press',
  'Flat Dumbbell Press': 'Dumbbell Bench Press',
  'Flat Barbell Bench Press': 'Barbell Bench Press',
  'Bench Press': 'Barbell Bench Press',
  'Barbell Larsen Press (male)': 'Barbell Bench Press',
  'Kettlebell Floor Press': 'Barbell Bench Press',
  'Wide-Grip Lat Pulldown': 'Lat Pulldown',
  'Cable Wide-Grip Lat Pulldown': 'Lat Pulldown',
  'Bar Lateral Pulldown': 'Lat Pulldown',
  'Cable Reverse Grip Pulldown': 'Lat Pulldown',
  'Straight-Arm Pulldown': 'Lat Pulldown',
  'Dumbbell Straight Arm Pullover': 'Lat Pulldown',
  'Dumbbell Pullover': 'Lat Pulldown',
  'Single-Arm Dumbbell Row': 'Dumbbell Row',
  'Dumbbell One Arm Bent-over Row': 'Dumbbell Row',
  'Lever Seated Row': 'Seated Cable Row',
  'Lever Neutral Grip Seated Row': 'Seated Cable Row',
  'Lever T bar Row': 'T-Bar Row',
  'Lever Lying T-bar Row': 'T-Bar Row',
  'Chest-Supported Row': 'T-Bar Row',
  'Inverted Row': 'Barbell Row',
  'Barbell Hip Thrust': 'Hip Thrust',
  'Glute Bridge': 'Hip Thrust',
  'Cable Pull-Through': 'Hip Thrust',
  'Dumbbell Curl': 'Barbell Curl',
  'Biceps Curl': 'Barbell Curl',
  'EZ Barbell Curl': 'EZ Bar Curl',
  'Cable Curl': 'EZ Bar Curl',
  'Lever Preacher Curl': 'Preacher Curl',
  'Dumbbell Hammer Curl': 'Hammer Curl',
  'Pause Squat': 'Barbell Back Squat',
  'Smith Squat': 'Barbell Back Squat',
  'Full Squat': 'Barbell Back Squat',
  'Sled Hack Squat': 'Hack Squat',
  'Jump Squat': 'Goblet Squat',
  'Bodyweight Squat': 'Goblet Squat',
  'Pistol Squat': 'Goblet Squat',
  'Kettlebell Goblet Squat': 'Goblet Squat',
  'Lever Standing Calf Raise': 'Standing Calf Raise',
  'Lever Seated Leg Press': 'Leg Press',
  'Lever Leg Extension': 'Leg Extension',
  'Barbell Romanian Deadlift': 'Romanian Deadlift',
  'Barbell Stiff Legged Deadlift': 'Romanian Deadlift',
  'Deficit Deadlift': 'Deadlift',
  'Power Clean': 'Deadlift',
  'Kettlebell Swing': 'Romanian Deadlift',
  'Kettlebell Romanian Deadlift': 'Romanian Deadlift',
  'Step-up': 'Walking Lunge',
  'Dumbbell Walking Lunges': 'Walking Lunge',
  'High Knees Lunge': 'Walking Lunge',
  'Kettlebell Reverse Lunge': 'Reverse Lunge',
  'Pec Deck': 'Cable Crossover',
  'Cable Bent Over Fly': 'Cable Crossover',
  'Cable Standing Fly': 'Cable Crossover',
  'Lever Seated Fly': 'Cable Crossover',
  'Low-to-High Cable Fly': 'Cable Crossover',
  'Incline Cable Fly': 'Cable Crossover',
  'Cable Seated Rear Delt Fly': 'Rear Delt Fly',
  'Lever Seated Reverse Fly': 'Rear Delt Fly',
  'Cable Kneeling Rear Delt Row': 'Face Pull',
  'Omni Directional Face Pull': 'Face Pull',
  'Cable Shrug': 'Barbell Shrug',
  'Cable Kneeling Crunch': 'Cable Crunch',
  'Weighted Decline Crunch': 'Cable Crunch',
  'Captains Chair Straight Leg Raise': 'Hanging Leg Raise',
};

/** Programs that duplicate a built-in plan above — ignored on import. */
const SKIP_PROGRAMS = new Set([
  'ppl-3day',
  'upper-lower-4day',
  'bro-split-5day',
  'arnold-split-6day',
  'full-body-3day',
  'phul-4day',
  'dumbbell-only-fullbody',
  'stronglifts-5x5',
]);

const focusOf = (exs: RawEx[]): string => {
  const seen: string[] = [];
  for (const e of exs) for (const m of e.muscles) if (!seen.includes(m)) seen.push(m);
  return seen.slice(0, 3).join(' · ');
};
const aliasEx = (n: string): string => EX_ALIAS[n] ?? n;

/** Plain gym names for the imported programs (no fancy / branded names). */
const NAME_OVERRIDE: Record<string, string> = {
  'ppl-upper-lower-5day': 'PPL + Upper Lower (5 Day)',
  'ppl-x-arnold-6day': 'PPL + Arnold (6 Day)',
  'classic-3day-pairing': 'Classic 3-Day',
  'phat-5day': 'Power & Pump (5 Day)',
  'wendler-531-4day': 'Strength 5/3/1 (4 Day)',
  'dorian-yates-hit-4day': 'Heavy Duty (4 Day)',
  'calisthenics-bodyweight': 'Calisthenics (3 Day)',
  'at-home-no-equipment': 'Home No Gear (3 Day)',
  'v-taper-4day': 'V-Taper (4 Day)',
  'classic-physique-5day': 'Classic Physique (5 Day)',
  'greek-god-3day': 'Lean Aesthetic (3 Day)',
  'superhero-4day': 'Hollywood (4 Day)',
  'glute-focused-4day': 'Glute Focus (4 Day)',
  'beach-body-3day': 'Beach Body (3 Day)',
  'boulder-shoulders-4day': 'Boulder Shoulders (4 Day)',
  'big-arms-4day': 'Big Arms (4 Day)',
  'starting-strength-3day': 'Beginner Barbell (3 Day)',
  'madcow-5x5': 'Intermediate 5×5 (3 Day)',
  'nsuns-531-5day': 'High Volume Strength (5 Day)',
  'gzclp-4day': 'Beginner Strength (4 Day)',
  'powerbuilding-4day': 'Powerbuilding (4 Day)',
  'powerlifting-4day': 'Powerlifting (4 Day)',
  'fat-loss-circuit-3day': 'Fat Loss (3 Day)',
  'hiit-strength-4day': 'HIIT + Strength (4 Day)',
  'athletic-performance-4day': 'Athletic (4 Day)',
  'sprinter-aesthetic-4day': 'Lean Athletic (4 Day)',
  'back-specialisation-4day': 'Back Focus (4 Day)',
  'leg-specialisation-4day': 'Leg Focus (4 Day)',
  'chest-specialisation-4day': 'Chest Focus (4 Day)',
  'kettlebell-only-3day': 'Kettlebell (3 Day)',
  'gymnast-calisthenics-4day': 'Advanced Calisthenics (4 Day)',
};

/** Extra hand-added splits (from the workout screenshots). Plain names. */
const EXTRA_PROGRAMS: Array<{
  id: string;
  name: string;
  tag: string;
  desc: string;
  days: PlanDay[];
}> = [
  {
    id: 'hip-mobility',
    name: 'Hip Mobility',
    tag: '1 day · Beginner',
    desc: 'Loosen tight hips and open up your range of motion.',
    days: [
      {
        name: 'Mobility',
        focus: 'Hips · Mobility',
        ex: [
          "World's Greatest Stretch",
          'Standing Hip Circles',
          'Groiner Stretch',
          'Hip Flexor Stretch',
          'Lying Glute Stretch',
          'Cat-Cow Stretch',
        ],
      },
    ],
  },
  {
    id: 'full-body-strength-3day',
    name: 'Full Body Strength (3 Day)',
    tag: '3 days · All levels',
    desc: 'Three full-body sessions a week — squat, hinge, push and pull every day.',
    days: [
      {
        name: 'Day 1',
        focus: 'Quads · Chest · Back',
        ex: [
          'Barbell Back Squat',
          'Barbell Bench Press',
          'Lat Pulldown',
          'Romanian Deadlift',
          'Dips',
          'Standing Calf Raise',
          'Barbell Curl',
        ],
      },
      {
        name: 'Day 2',
        focus: 'Hinge · Shoulders · Back',
        ex: [
          'Deadlift',
          'Overhead Press',
          'Barbell Row',
          'Leg Extension',
          'Cable Fly',
          'Cable Crunch',
          'Skullcrusher',
        ],
      },
      {
        name: 'Day 3',
        focus: 'Legs · Chest · Back',
        ex: [
          'Walking Lunge',
          'Incline Dumbbell Press',
          'Lat Pulldown',
          'Hip Thrust',
          'Face Pull',
          'Lateral Raise',
          'Lying Leg Curl',
        ],
      },
    ],
  },
  {
    id: 'legs-day',
    name: 'Legs Day',
    tag: '1 day · Intermediate',
    desc: 'A complete, dedicated leg session — quads, hams and calves.',
    days: [
      {
        name: 'Legs',
        focus: 'Quads · Hamstrings · Calves',
        ex: [
          'Barbell Back Squat',
          'Romanian Deadlift',
          'Leg Press',
          'Leg Extension',
          'Lying Leg Curl',
          'Standing Calf Raise',
          'Walking Lunge',
        ],
      },
    ],
  },
  {
    id: 'upper-day',
    name: 'Upper Body',
    tag: '1 day · Intermediate',
    desc: 'A complete, dedicated upper-body session — chest, back, shoulders and arms.',
    days: [
      {
        name: 'Upper',
        focus: 'Chest · Back · Shoulders',
        ex: [
          'Barbell Bench Press',
          'Barbell Row',
          'Seated Dumbbell Shoulder Press',
          'Lat Pulldown',
          'Lateral Raise',
          'Barbell Curl',
          'Tricep Pushdown',
        ],
      },
    ],
  },
  {
    id: 'ppl-hypertrophy-6day',
    name: 'PPL Hypertrophy (6 Day)',
    tag: '6 days · Intermediate',
    desc: 'A high-volume push/pull/legs split run twice through the week for size.',
    days: [
      {
        name: 'Push 1',
        focus: 'Chest · Shoulders · Triceps',
        ex: [
          'Barbell Bench Press',
          'Incline Dumbbell Press',
          'Seated Dumbbell Shoulder Press',
          'Cable Fly',
          'Lateral Raise',
          'Tricep Pushdown',
          'Skullcrusher',
        ],
      },
      {
        name: 'Pull 1',
        focus: 'Back · Biceps',
        ex: [
          'Lat Pulldown',
          'Seated Cable Row',
          'Pull-Up',
          'Face Pull',
          'Barbell Curl',
          'Preacher Curl',
        ],
      },
      {
        name: 'Legs 1',
        focus: 'Quads · Hamstrings · Core',
        ex: [
          'Barbell Back Squat',
          'Romanian Deadlift',
          'Walking Lunge',
          'Lying Leg Curl',
          'Standing Calf Raise',
          'Cable Crunch',
        ],
      },
      {
        name: 'Push 2',
        focus: 'Chest · Shoulders · Triceps',
        ex: [
          'Incline Dumbbell Press',
          'Seated Dumbbell Shoulder Press',
          'Skullcrusher',
          'Cable Fly',
          'Lateral Raise',
          'Push-Up',
        ],
      },
      {
        name: 'Pull 2',
        focus: 'Back · Biceps',
        ex: [
          'Lat Pulldown',
          'Pull-Up',
          'Barbell Row',
          'Barbell Shrug',
          'Rear Delt Fly',
          'Hammer Curl',
        ],
      },
      {
        name: 'Legs 2',
        focus: 'Hamstrings · Quads · Calves',
        ex: [
          'Deadlift',
          'Romanian Deadlift',
          'Leg Press',
          'Leg Extension',
          'Standing Calf Raise',
          'Hanging Leg Raise',
        ],
      },
    ],
  },
];

/** Sets×reps prescription for a program exercise, e.g. 4 sets of 6–8. */
const srOf = (e: RawEx): string => `${e.sets} × ${e.reps ? e.reps : '8–12'}`;

/** The imported program catalogue + extras, keyed by id, in FORGE's Plan shape. */
export const PROGRAMS: Record<string, RoutinePlan> = {
  ...Object.fromEntries(
    (programsRaw as { programs: RawProgram[] }).programs
      .filter((p) => !SKIP_PROGRAMS.has(p.id))
      .map((p) => [
        p.id,
        {
          name: NAME_OVERRIDE[p.id] ?? p.name,
          // Tag the number of distinct sessions actually defined (matches both
          // the "choose session" list and the days/week filter), not the source
          // program's nominal weekly frequency, which can differ.
          tag: `${p.days.length} day${p.days.length === 1 ? '' : 's'} · ${p.level}`,
          desc: p.goal,
          days: p.days.map((d) => ({
            name: d.name,
            focus: focusOf(d.exercises),
            ex: d.exercises.map((e) => aliasEx(e.name)),
          })),
          // Honour each exercise's prescribed sets×reps from the source program.
          sr: Object.fromEntries(
            p.days.flatMap((d) => d.exercises.map((e) => [aliasEx(e.name), srOf(e)])),
          ),
        },
      ]),
  ),
  ...Object.fromEntries(
    EXTRA_PROGRAMS.map((p) => [
      p.id,
      {
        name: p.name,
        tag: p.tag,
        desc: p.desc,
        days: p.days.map((d) => ({ name: d.name, focus: d.focus, ex: d.ex.map(aliasEx) })),
      },
    ]),
  ),
};

/** A plan as the app consumes it — built-in or a resolved custom routine. */
export interface RoutinePlan extends Plan {
  /** Optional per-exercise sets×reps override (custom routines only). */
  sr?: Record<string, string>;
  /** True for user-created routines. */
  custom?: boolean;
}

export type PlanLevel = 'beginner' | 'intermediate' | 'advanced';
export const PLAN_LEVELS: readonly PlanLevel[] = ['beginner', 'intermediate', 'advanced'];

/** Pulls a difficulty level out of a tag string, e.g. "4 days · Intermediate". */
function levelFromTag(tag: string): PlanLevel | null {
  const t = tag.toLowerCase();
  return PLAN_LEVELS.find((lvl) => t.includes(lvl)) ?? null;
}

/** Curated levels for the flagship built-in plans (their tags carry no level). */
const BUILTIN_LEVEL: Record<string, PlanLevel> = {
  ppl: 'beginner',
  ul: 'intermediate',
  bro: 'intermediate',
  fb: 'beginner',
  arnold: 'advanced',
  phul: 'intermediate',
  str5: 'beginner',
  busy2: 'beginner',
  db: 'beginner',
  bw: 'beginner',
};

/** A catalogue entry with the metadata the Train picker filters on. */
export interface CatalogueEntry {
  id: string;
  plan: RoutinePlan;
  /** Training sessions defined per week. */
  days: number;
  /** Difficulty level for filtering, or null for all-level plans. */
  level: PlanLevel | null;
}

/** The full built-in + imported plan catalogue with filter metadata. */
export const PLAN_CATALOGUE: readonly CatalogueEntry[] = [
  ...Object.entries(PLANS as Record<string, Plan>).map(([id, plan]) => ({
    id,
    plan,
    days: plan.days.length,
    level: BUILTIN_LEVEL[id] ?? levelFromTag(plan.tag),
  })),
  ...Object.entries(PROGRAMS).map(([id, plan]) => ({
    id,
    plan,
    days: plan.days.length,
    level: levelFromTag(plan.tag),
  })),
];

/** Prefix that marks a custom-routine plan id. */
export const CUSTOM_PREFIX = 'custom:';
export const isCustomPlanId = (id: string): boolean => id.startsWith(CUSTOM_PREFIX);

/** A fresh, collision-resistant id for a new custom routine. */
export function newCustomPlanId(): string {
  return `${CUSTOM_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 11)}`;
}

function customToRoutine(c: CustomPlan): RoutinePlan {
  return {
    name: c.name,
    tag: `${c.days.length} day${c.days.length === 1 ? '' : 's'} · custom`,
    desc: 'Your custom routine.',
    days: c.days.map((d) => ({ name: d.name, focus: d.focus ?? '', ex: d.ex })),
    custom: true,
    ...(c.sr ? { sr: c.sr } : {}),
  };
}

/**
 * Resolves any plan id — built-in or a user routine — to a usable plan,
 * falling back to PPL for unknown ids.
 */
export function getPlan(id: string, customPlans: readonly CustomPlan[] = []): RoutinePlan {
  const custom = customPlans.find((c) => c.id === id);
  if (custom) return customToRoutine(custom);
  return (PLANS as Record<string, Plan>)[id] ?? PROGRAMS[id] ?? PLANS[DEFAULT_PLAN_ID];
}

/**
 * The id a plan id actually resolves to — itself when it's a known built-in or
 * an existing custom routine, otherwise the default. Use this to record what
 * was really trained when the active plan may have been deleted.
 */
export function resolvePlanId(id: string, customPlans: readonly CustomPlan[] = []): string {
  if (customPlans.some((c) => c.id === id)) return id;
  if (Object.prototype.hasOwnProperty.call(PLANS, id)) return id;
  if (Object.prototype.hasOwnProperty.call(PROGRAMS, id)) return id;
  return DEFAULT_PLAN_ID;
}

/** The sets×reps prescription for an exercise within a plan (custom override → default). */
export function planSr(plan: RoutinePlan, name: string): string {
  return plan.sr?.[name] ?? getExercise(name)?.sr ?? '';
}

/** Equipment options: [id, label]. */
export const EQUIPMENT: ReadonlyArray<readonly [string, string]> = [
  ['barbell', 'Barbell & plates'],
  ['dumbbell', 'Dumbbells'],
  ['cable', 'Cable machine'],
  ['machine', 'Pin-loaded machines'],
  ['bench', 'Adjustable bench'],
  ['pullupbar', 'Pull-up / dip bars'],
];

export const DEFAULT_GEAR = EQUIPMENT.map(([id]) => id);
