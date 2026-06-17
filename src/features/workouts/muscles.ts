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
  { id: 'core', label: 'Core', side: 'front', match: ['core', 'abs'] },
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
