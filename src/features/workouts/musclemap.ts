import { musclesWorked, type MuscleGroup } from './muscles';

/**
 * Maps FORGE's muscle groups onto the wger anatomical muscle artwork
 * (CC-BY-SA 3.0, bundled in public/muscles/) using plain gym names — one clean
 * label + arrow per worked group, not the textbook latin names.
 */

export type Side = 'front' | 'back';

export interface GroupDef {
  /** Plain-English gym name. */
  label: string;
  side: Side;
  /** wger overlay ids to colour for this group. */
  overlays: number[];
  /** Where the arrow points, as a fraction of the figure box [x, y]. */
  anchor: readonly [number, number];
}

export const GROUPS: Record<MuscleGroup, GroupDef> = {
  chest: { label: 'Chest', side: 'front', overlays: [4], anchor: [0.42, 0.23] },
  shoulders: { label: 'Shoulders', side: 'front', overlays: [2], anchor: [0.28, 0.2] },
  biceps: { label: 'Biceps', side: 'front', overlays: [1, 13], anchor: [0.19, 0.33] },
  core: { label: 'Abs', side: 'front', overlays: [6, 14], anchor: [0.5, 0.38] },
  quads: { label: 'Quads', side: 'front', overlays: [10], anchor: [0.4, 0.58] },
  triceps: { label: 'Triceps', side: 'back', overlays: [5], anchor: [0.22, 0.32] },
  back: { label: 'Back', side: 'back', overlays: [12, 9], anchor: [0.36, 0.32] },
  glutes: { label: 'Glutes', side: 'back', overlays: [8], anchor: [0.42, 0.49] },
  hamstrings: { label: 'Hamstrings', side: 'back', overlays: [11], anchor: [0.4, 0.62] },
  calves: { label: 'Calves', side: 'back', overlays: [7, 15], anchor: [0.43, 0.82] },
};

export interface WorkedGroup {
  id: MuscleGroup;
  primary: boolean;
}

/** The muscle groups an exercise works, primary first, deduped. */
export function exerciseGroups(name: string): WorkedGroup[] {
  const { primary, secondary } = musclesWorked(name);
  const seen = new Set<MuscleGroup>();
  const out: WorkedGroup[] = [];
  for (const id of primary)
    if (GROUPS[id] && !seen.has(id)) {
      seen.add(id);
      out.push({ id, primary: true });
    }
  for (const id of secondary)
    if (GROUPS[id] && !seen.has(id)) {
      seen.add(id);
      out.push({ id, primary: false });
    }
  return out;
}
