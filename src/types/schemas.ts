import { z } from 'zod';

/**
 * Zod schemas for everything FORGE persists. Every stored value is `unknown`
 * until it passes through here. The whole shape is modelled on the original
 * prototype's `DEFAULT_DATA` + onboarding profile so old saves keep loading.
 *
 * Resilience strategy: each field carries a `.catch(default)`, so a single
 * corrupt value falls back to a safe default instead of rejecting the whole
 * save. The top-level schema also has a `.catch`, so non-object garbage falls
 * back to a complete default state. Nothing here ever throws.
 */

/** Bump this whenever the persisted shape changes; add a migration to match. */
export const CURRENT_SCHEMA_VERSION = 1;

/** A finite number or the given fallback — never NaN/Infinity into state. */
const num = (fallback: number) =>
  z
    .number()
    .refine((n) => Number.isFinite(n), { message: 'must be a finite number' })
    .catch(fallback);

/** A finite number with no fallback (used inside optional fields). */
const finite = z.number().refine((n) => Number.isFinite(n), {
  message: 'must be a finite number',
});

export const SexSchema = z.enum(['m', 'f']);
export const GoalSchema = z.enum(['lose', 'maintain', 'gain']);
export const ActivitySchema = z.enum(['sedentary', 'light', 'moderate', 'high']);
export const ExperienceSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const WeightUnitSchema = z.enum(['kg', 'lb']);
export const HeightUnitSchema = z.enum(['cm', 'ftin']);

export const AccentSchema = z.enum([
  'pulse',
  'violet',
  'ember',
  'volt',
  'ocean',
  'berry',
  'gold',
  'mint',
]);

export const LangSchema = z.enum([
  'en',
  'es',
  'fr',
  'de',
  'it',
  'pt',
  'pl',
  'nl',
  'tr',
  'ru',
  'ar',
  'hi',
  'ja',
  'zh',
]);

export const ProfileSchema = z.object({
  name: z.string().catch(''),
  sex: SexSchema.catch('m'),
  age: num(25),
  height: num(175),
  weight: num(75),
  targetWeight: num(75),
  weightUnit: WeightUnitSchema.catch('kg'),
  heightUnit: HeightUnitSchema.catch('cm'),
  goal: GoalSchema.catch('maintain'),
  activity: ActivitySchema.catch('moderate'),
  experience: ExperienceSchema.catch('beginner'),
  allergies: z.array(z.string()).catch([]),
  dislikes: z.array(z.string()).catch([]),
});

export const SettingsSchema = z.object({
  dark: z.boolean().catch(true),
  accent: AccentSchema.catch('pulse'),
  lang: LangSchema.catch('en'),
});

export const ScheduleEntrySchema = z.object({
  day: z.string().catch('0'),
  time: z.string().catch('18:00'),
});

export const RemindSchema = z.object({
  on: z.boolean().catch(true),
  lead: num(30),
});

export const FoodEntrySchema = z.object({
  meal: z.string().catch('snacks'),
  n: z.string().optional(),
  name: z.string().optional(),
  kcal: num(0),
  p: num(0),
  c: num(0),
  f: num(0),
  fiber: finite.optional(),
  sugar: finite.optional(),
  sodium: finite.optional(),
  satfat: finite.optional(),
  potassium: finite.optional(),
  calcium: finite.optional(),
  iron: finite.optional(),
  vitc: finite.optional(),
  basis: z.string().optional(),
});

export const WeightEntrySchema = z.object({
  d: z.string().catch(''),
  w: num(0),
});

export const DoneEntrySchema = z.object({
  d: z.string().catch(''),
  plan: z.string().optional(),
  day: z.string().catch(''),
  vol: finite.optional(),
  sets: finite.optional(),
  muscles: z.record(z.string(), finite).optional(),
});

export const SetSchema = z.object({
  w: z.union([z.string(), z.number()]).catch(''),
  reps: z.union([z.string(), z.number()]).catch(''),
  done: z.boolean().catch(false),
});

export const ActiveSchema = z.object({
  day: num(0),
  checked: z.array(z.unknown()).catch([]),
  swaps: z.record(z.string(), z.string()).catch({}),
  sets: z.record(z.string(), z.array(SetSchema).catch([])).catch({}).optional(),
});

export const LiftEntrySchema = z.object({
  d: z.string().catch(''),
  w: num(0),
  reps: finite.optional(),
  e1rm: finite.optional(),
  hit: z.boolean().optional(),
});

export const SleepEntrySchema = z.object({
  h: finite.optional(),
  q: finite.optional(),
});

export const CustomPlanDaySchema = z.object({
  name: z.string().catch('Day'),
  focus: z.string().optional(),
  ex: z.array(z.string()).catch([]),
});

export const ShoppingItemSchema = z.object({
  name: z.string().catch(''),
  have: z.boolean().catch(false),
});

export const ProgressPhotoSchema = z.object({
  id: z.string().catch(''),
  /** Capture date, `YYYY-MM-DD`. */
  d: z.string().catch(''),
  /** Compressed JPEG data URL. */
  src: z.string().catch(''),
  /** Body weight (kg) snapshot at capture time, if known. */
  w: finite.optional(),
});

export const MealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

export const CustomRecipeSchema = z.object({
  id: z.string().catch(''),
  name: z.string().catch('My recipe'),
  kcal: num(0),
  p: num(0),
  c: num(0),
  f: num(0),
  ing: z.array(z.string()).catch([]),
  meal: MealTypeSchema.optional(),
  time: z.string().optional(),
  desc: z.string().optional(),
  steps: z.array(z.string()).optional(),
});

export const CustomPlanSchema = z.object({
  id: z.string().catch(''),
  name: z.string().catch('My routine'),
  days: z.array(CustomPlanDaySchema).catch([]),
  /** Optional per-exercise sets×reps override (e.g. "4 × 6–8"). */
  sr: z.record(z.string(), z.string()).optional(),
});

/**
 * The full persisted state. Mirrors the prototype's `DEFAULT_DATA` plus a
 * `schemaVersion`. Records are keyed by date string (`YYYY-MM-DD`) or day index.
 */
export const PersistedStateSchema = z
  .object({
    schemaVersion: z.literal(CURRENT_SCHEMA_VERSION).catch(CURRENT_SCHEMA_VERSION),
    profile: ProfileSchema.nullable().catch(null),
    settings: SettingsSchema.catch({ dark: true, accent: 'pulse', lang: 'en' }),
    planId: z.string().catch('ppl'),
    schedule: z.record(z.string(), ScheduleEntrySchema).catch({}),
    remind: RemindSchema.catch({ on: true, lead: 30 }),
    foodLog: z.record(z.string(), z.array(FoodEntrySchema).catch([])).catch({}),
    water: z.record(z.string(), num(0)).catch({}),
    weights: z.array(WeightEntrySchema).catch([]),
    done: z.array(DoneEntrySchema).catch([]),
    active: ActiveSchema.nullable().catch(null),
    pro: z.boolean().catch(false),
    sleep: z.record(z.string(), SleepEntrySchema.catch({})).catch({}),
    devices: z.array(z.string()).catch([]),
    measure: z.record(z.string(), z.record(z.string(), num(0)).catch({})).catch({}),
    gear: z
      .array(z.string())
      .catch(['barbell', 'dumbbell', 'cable', 'machine', 'bench', 'pullupbar']),
    lifts: z.record(z.string(), z.array(LiftEntrySchema).catch([])).catch({}),
    customPlans: z.array(CustomPlanSchema).catch([]),
    shopping: z.array(ShoppingItemSchema).catch([]),
    customRecipes: z.array(CustomRecipeSchema).catch([]),
  })
  .catch(() => defaultState());

/**
 * Progress photos are persisted under a SEPARATE storage key (not in the main
 * state blob) so their base64 payload can never starve the quota of the
 * hot-path data (food log, workouts, weights). See lib/storage `loadPhotos`.
 *
 * Validated element-by-element so a single corrupt entry only drops itself and
 * the user's other photos are always salvaged. Entries missing an id or image
 * source are discarded.
 */
export const ProgressPhotosSchema = z
  .array(z.unknown())
  .catch([])
  .transform((arr) =>
    arr.flatMap((x) => {
      const r = ProgressPhotoSchema.safeParse(x);
      return r.success && r.data.id !== '' && r.data.src !== '' ? [r.data] : [];
    }),
  );

export type Profile = z.infer<typeof ProfileSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type FoodEntry = z.infer<typeof FoodEntrySchema>;
export type WeightEntry = z.infer<typeof WeightEntrySchema>;
export type DoneEntry = z.infer<typeof DoneEntrySchema>;
export type ActiveWorkout = z.infer<typeof ActiveSchema>;
export type LiftEntry = z.infer<typeof LiftEntrySchema>;
export type CustomPlan = z.infer<typeof CustomPlanSchema>;
export type ShoppingItem = z.infer<typeof ShoppingItemSchema>;
export type CustomRecipe = z.infer<typeof CustomRecipeSchema>;
export type ProgressPhoto = z.infer<typeof ProgressPhotoSchema>;
export type PersistedState = z.infer<typeof PersistedStateSchema>;

/** A complete, valid default state for first run or unrecoverable data. */
export function defaultState(): PersistedState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: null,
    settings: { dark: true, accent: 'pulse', lang: 'en' },
    planId: 'ppl',
    schedule: {
      '0': { day: '0', time: '18:00' },
      '2': { day: '1', time: '18:00' },
      '4': { day: '2', time: '18:00' },
    },
    remind: { on: true, lead: 30 },
    foodLog: {},
    water: {},
    weights: [],
    done: [],
    active: null,
    pro: false,
    sleep: {},
    devices: [],
    measure: {},
    gear: ['barbell', 'dumbbell', 'cable', 'machine', 'bench', 'pullupbar'],
    lifts: {},
    customPlans: [],
    shopping: [],
    customRecipes: [],
  };
}
