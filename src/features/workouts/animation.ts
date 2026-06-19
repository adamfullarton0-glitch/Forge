/**
 * Maps each exercise to a movement "archetype" so the app can show a looping,
 * ad-free SVG animation of the lift instead of an embedded video. The figure is
 * drawn side-on (profile), so every motion is a single in-plane rotation — no
 * left/right mirroring to get wrong. Pure + deterministic.
 */
import { EXERCISE_NAMES } from './exercises';

export type MoveType =
  | 'squat'
  | 'hinge'
  | 'pressUp'
  | 'pressFwd'
  | 'pullDown'
  | 'row'
  | 'curl'
  | 'raise'
  | 'pushdown'
  | 'calf'
  | 'core';

const BY_NAME: Record<string, MoveType> = {
  'Barbell Bench Press': 'pressFwd',
  'Incline Dumbbell Press': 'pressFwd',
  'Push-Up': 'pressFwd',
  'Cable Fly': 'pressFwd',
  'Overhead Press': 'pressUp',
  'Seated Dumbbell Shoulder Press': 'pressUp',
  Dips: 'pressUp',
  'Lateral Raise': 'raise',
  'Rear Delt Fly': 'row',
  'Face Pull': 'row',
  'Barbell Row': 'row',
  'Seated Cable Row': 'row',
  'Tricep Pushdown': 'pushdown',
  Skullcrusher: 'pushdown',
  'Pull-Up': 'pullDown',
  'Lat Pulldown': 'pullDown',
  'Barbell Curl': 'curl',
  'Hammer Curl': 'curl',
  'Preacher Curl': 'curl',
  Deadlift: 'hinge',
  'Romanian Deadlift': 'hinge',
  'Dumbbell Romanian Deadlift': 'hinge',
  'Lying Leg Curl': 'hinge',
  'Hip Thrust': 'hinge',
  'Barbell Back Squat': 'squat',
  'Front Squat': 'squat',
  'Goblet Squat': 'squat',
  'Leg Press': 'squat',
  'Leg Extension': 'squat',
  'Walking Lunge': 'squat',
  'Standing Calf Raise': 'calf',
  'Barbell Shrug': 'calf',
  Plank: 'core',
};

/** The movement archetype for an exercise (falls back to a forward press). */
export function moveTypeOf(name: string): MoveType {
  return BY_NAME[name] ?? 'pressFwd';
}

/** A short label describing the animated pattern. */
export const MOVE_LABEL: Record<MoveType, string> = {
  squat: 'Squat pattern',
  hinge: 'Hip hinge',
  pressUp: 'Overhead press',
  pressFwd: 'Horizontal press',
  pullDown: 'Vertical pull',
  row: 'Horizontal pull',
  curl: 'Elbow curl',
  raise: 'Front/side raise',
  pushdown: 'Elbow extension',
  calf: 'Calf / shrug raise',
  core: 'Core hold',
};

/** Every bundled exercise resolves to a known archetype (used by tests). */
export function allExercisesMapped(): boolean {
  return EXERCISE_NAMES.every((n) => n in BY_NAME);
}
