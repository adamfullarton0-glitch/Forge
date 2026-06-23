import { musclesWorked, type MuscleGroup } from './muscles';

/**
 * Maps FORGE's coarse muscle groups onto the wger anatomical muscle-map artwork
 * (CC-BY-SA 3.0, bundled in public/muscles/), so an exercise's worked muscles
 * can be highlighted on a real front/back anatomical figure with proper names.
 */

export type Side = 'front' | 'back';

/** wger muscle id → [anatomical name, which figure it sits on]. */
export const WGER_MUSCLES: Record<number, readonly [string, Side]> = {
  1: ['Biceps brachii', 'front'],
  2: ['Anterior deltoid', 'front'],
  4: ['Pectoralis major', 'front'],
  5: ['Triceps brachii', 'back'],
  6: ['Rectus abdominis', 'front'],
  7: ['Gastrocnemius', 'back'],
  8: ['Gluteus maximus', 'back'],
  9: ['Trapezius', 'back'],
  10: ['Quadriceps femoris', 'front'],
  11: ['Biceps femoris', 'back'],
  12: ['Latissimus dorsi', 'back'],
  13: ['Brachialis', 'front'],
  14: ['Obliquus externus abdominis', 'front'],
  15: ['Soleus', 'back'],
  16: ['Erector spinae', 'back'],
};

const GROUP_TO_WGER: Record<MuscleGroup, number[]> = {
  chest: [4],
  shoulders: [2],
  back: [12, 9, 16],
  biceps: [1, 13],
  triceps: [5],
  core: [6, 14],
  quads: [10],
  hamstrings: [11],
  glutes: [8],
  calves: [7, 15],
};

export interface MuscleHighlight {
  /** wger ids worked as prime movers (red overlay). */
  primary: number[];
  /** wger ids worked as assisting muscles (orange overlay). */
  secondary: number[];
}

const ids = (groups: MuscleGroup[]): number[] => groups.flatMap((g) => GROUP_TO_WGER[g]);

/** The wger muscle ids an exercise works, split primary vs secondary (deduped). */
export function exerciseMuscleMap(name: string): MuscleHighlight {
  const { primary, secondary } = musclesWorked(name);
  const prim = [...new Set(ids(primary))];
  const sec = [...new Set(ids(secondary))].filter((id) => !prim.includes(id));
  return { primary: prim, secondary: sec };
}
