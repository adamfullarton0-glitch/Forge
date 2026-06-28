/**
 * Maps the exercise database onto the major muscle groups shown on the body
 * map. Matching is keyword-based against each exercise's `m` (muscles-worked)
 * string, so it stays correct as the database grows. All functions are pure.
 */
import { EX, EXERCISE_NAMES } from './exercises';

export type MuscleGroup =
  | 'chest'
  | 'shoulders'
  | 'back'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves';

export interface MuscleGroupDef {
  id: MuscleGroup;
  label: string;
  /** Which figure the region sits on. */
  side: 'front' | 'back';
  /** Lowercase fragments that appear in an exercise's `m` field. */
  match: string[];
}

export const MUSCLE_GROUPS: readonly MuscleGroupDef[] = [
  { id: 'chest', label: 'Chest', side: 'front', match: ['chest'] },
  { id: 'shoulders', label: 'Shoulders', side: 'front', match: ['delt', 'shoulder'] },
  { id: 'biceps', label: 'Biceps', side: 'front', match: ['bicep'] },
  { id: 'core', label: 'Abs', side: 'front', match: ['core', 'abs'] },
  { id: 'quads', label: 'Quads', side: 'front', match: ['quad'] },
  { id: 'calves', label: 'Calves', side: 'front', match: ['calf', 'calves'] },
  { id: 'back', label: 'Back', side: 'back', match: ['lat', 'back', 'trap'] },
  { id: 'triceps', label: 'Triceps', side: 'back', match: ['tricep'] },
  { id: 'glutes', label: 'Glutes', side: 'back', match: ['glute', 'posterior chain'] },
  {
    id: 'hamstrings',
    label: 'Hamstrings',
    side: 'back',
    match: ['hamstring', 'posterior chain'],
  },
];

const defOf = (group: MuscleGroup): MuscleGroupDef | undefined =>
  MUSCLE_GROUPS.find((g) => g.id === group);

/** True if an exercise trains the given muscle group. */
export function trains(name: string, group: MuscleGroup): boolean {
  const def = defOf(group);
  if (!def) return false;
  const m = (EX[name]?.m ?? '').toLowerCase();
  return def.match.some((kw) => m.includes(kw));
}

export interface MusclesWorked {
  /** Prime movers (the first muscle listed in the exercise's `m` field). */
  primary: MuscleGroup[];
  /** Assisting groups (the rest), shown dimmer on the diagram. */
  secondary: MuscleGroup[];
}

const groupsIn = (text: string): MuscleGroup[] => {
  const t = text.toLowerCase();
  return MUSCLE_GROUPS.filter((g) => g.match.some((kw) => t.includes(kw))).map((g) => g.id);
};

/**
 * Splits an exercise's muscles into prime movers vs assisting groups for the
 * "muscles worked" diagram. The `m` field reads e.g. "Chest · Triceps · Front
 * delts" — the first segment is the primary target, the rest are secondary.
 */
export function musclesWorked(name: string): MusclesWorked {
  const segments = (EX[name]?.m ?? '').split('·');
  const primary = groupsIn(segments[0] ?? '');
  const secondary = groupsIn(segments.slice(1).join(' ')).filter((g) => !primary.includes(g));
  return { primary, secondary };
}

/** All exercise names that train the given muscle group. */
export function exercisesForMuscle(group: MuscleGroup): string[] {
  return EXERCISE_NAMES.filter((n) => trains(n, group));
}

/** How many exercises hit each group — used for the map's badges. */
export function muscleCounts(): Record<MuscleGroup, number> {
  const out = {} as Record<MuscleGroup, number>;
  for (const g of MUSCLE_GROUPS) out[g.id] = exercisesForMuscle(g.id).length;
  return out;
}
