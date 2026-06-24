/** Workout plans and equipment — static data ported from the prototype. */
import { getExercise } from './exercises';
import programsRaw from './programs.json';
import type { CustomPlan } from '@/types/schemas';

export interface PlanDay {
  name: string;
  focus: string;
  /** Exercise names (keys into the exercise DB, ported in Phase 5). */
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
    tag: '6 days · golden era',
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
    tag: '3 days · raw strength',
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

/** Imported names → existing demo-DB exercises (case/grip/equipment variants). */
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
  'Cable Lateral Raise': 'Lateral Raise',
  'Standing Lateral Raise': 'Lateral Raise',
  'Leg Curl': 'Lying Leg Curl',
  'Nordic Curl': 'Lying Leg Curl',
  'Dumbbell Shoulder Press': 'Seated Dumbbell Shoulder Press',
  'Standing Overhead Press': 'Overhead Press',
  'Push Press': 'Overhead Press',
  'Kettlebell Overhead Press': 'Overhead Press',
  'Rope Pushdown': 'Tricep Pushdown',
  'Overhead Tricep Extension': 'Skullcrusher',
  'Dumbbell Overhead Tricep Extension': 'Skullcrusher',
  'Close-Grip Bench Press': 'Barbell Bench Press',
  'Weighted Dips': 'Dips',
  'Incline Barbell Press': 'Incline Dumbbell Press',
  'Incline Bench Press': 'Incline Dumbbell Press',
  'Incline Smith Machine Press': 'Incline Dumbbell Press',
  'Dumbbell Bench Press': 'Barbell Bench Press',
  'Flat Dumbbell Press': 'Barbell Bench Press',
  'Flat Barbell Bench Press': 'Barbell Bench Press',
  'Kettlebell Floor Press': 'Barbell Bench Press',
  'Medicine Ball Chest Throw': 'Barbell Bench Press',
  'Wide-Grip Lat Pulldown': 'Lat Pulldown',
  'Straight-Arm Pulldown': 'Lat Pulldown',
  'Dumbbell Pullover': 'Lat Pulldown',
  'Dumbbell Row': 'Barbell Row',
  'Single-Arm Dumbbell Row': 'Barbell Row',
  'Chest-Supported Row': 'Barbell Row',
  'T-Bar Row': 'Barbell Row',
  'Inverted Row': 'Barbell Row',
  'Single-Arm Kettlebell Row': 'Barbell Row',
  'Barbell Hip Thrust': 'Hip Thrust',
  'Glute Bridge': 'Hip Thrust',
  'Cable Pull-Through': 'Hip Thrust',
  'Incline Dumbbell Curl': 'Barbell Curl',
  'Dumbbell Curl': 'Barbell Curl',
  'Cable Curl': 'Barbell Curl',
  'Concentration Curl': 'Preacher Curl',
  'Hack Squat': 'Barbell Back Squat',
  'Pause Squat': 'Barbell Back Squat',
  'Jump Squat': 'Goblet Squat',
  'Bodyweight Squat': 'Goblet Squat',
  'Pistol Squat': 'Goblet Squat',
  'Kettlebell Goblet Squat': 'Goblet Squat',
  'Seated Calf Raise': 'Standing Calf Raise',
  'Sumo Deadlift': 'Deadlift',
  'Deficit Deadlift': 'Deadlift',
  'Power Clean': 'Deadlift',
  'Kettlebell Swing': 'Romanian Deadlift',
  'Kettlebell Romanian Deadlift': 'Romanian Deadlift',
  'Reverse Lunge': 'Walking Lunge',
  'Step-up': 'Walking Lunge',
  'Bulgarian Split Squat': 'Walking Lunge',
  'Kettlebell Reverse Lunge': 'Walking Lunge',
  'Pec Deck': 'Cable Fly',
  'Low-to-High Cable Fly': 'Cable Fly',
  'Incline Cable Fly': 'Cable Fly',
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

/** The imported program catalogue, keyed by id, in FORGE's Plan shape. */
export const PROGRAMS: Record<string, Plan> = Object.fromEntries(
  (programsRaw as { programs: RawProgram[] }).programs
    .filter((p) => !SKIP_PROGRAMS.has(p.id))
    .map((p) => [
      p.id,
      {
        name: p.name,
        tag: `${p.daysPerWeek} day${p.daysPerWeek === 1 ? '' : 's'} · ${p.level}`,
        desc: p.goal,
        days: p.days.map((d) => ({
          name: d.name,
          focus: focusOf(d.exercises),
          ex: d.exercises.map((e) => EX_ALIAS[e.name] ?? e.name),
        })),
      },
    ]),
);

/** A plan as the app consumes it — built-in or a resolved custom routine. */
export interface RoutinePlan extends Plan {
  /** Optional per-exercise sets×reps override (custom routines only). */
  sr?: Record<string, string>;
  /** True for user-created routines. */
  custom?: boolean;
}

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
