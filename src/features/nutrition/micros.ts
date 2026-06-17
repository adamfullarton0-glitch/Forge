/**
 * Micronutrient tracking: definitions (with daily targets), daily totals from
 * the food log, and per-nutrient progress. "goal" nutrients you want to reach;
 * "limit" nutrients you want to stay under. All functions are pure.
 */
import type { FoodEntry } from '@/types/schemas';

export type MicroKey =
  | 'fiber'
  | 'potassium'
  | 'calcium'
  | 'iron'
  | 'vitc'
  | 'sugar'
  | 'satfat'
  | 'sodium';

export interface MicroDef {
  key: MicroKey;
  label: string;
  unit: 'g' | 'mg';
  /** Daily target (goal) or ceiling (limit). */
  target: number;
  kind: 'goal' | 'limit';
  color: string;
}

/** Targets follow common adult reference intakes / dietary guidelines. */
export const MICROS: readonly MicroDef[] = [
  { key: 'fiber', label: 'Fiber', unit: 'g', target: 30, kind: 'goal', color: '#10B981' },
  {
    key: 'potassium',
    label: 'Potassium',
    unit: 'mg',
    target: 3500,
    kind: 'goal',
    color: '#3D8BFF',
  },
  { key: 'calcium', label: 'Calcium', unit: 'mg', target: 1000, kind: 'goal', color: '#6E8BFF' },
  { key: 'iron', label: 'Iron', unit: 'mg', target: 14, kind: 'goal', color: '#F5A623' },
  { key: 'vitc', label: 'Vitamin C', unit: 'mg', target: 80, kind: 'goal', color: '#F0A33C' },
  { key: 'sugar', label: 'Sugar', unit: 'g', target: 50, kind: 'limit', color: '#F5A623' },
  { key: 'satfat', label: 'Saturated fat', unit: 'g', target: 20, kind: 'limit', color: '#F0479C' },
  { key: 'sodium', label: 'Sodium', unit: 'mg', target: 2300, kind: 'limit', color: '#F0479C' },
];

const num = (v: number | undefined): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0;

export type MicroTotals = Record<MicroKey, number>;

/** Sum every tracked micronutrient across a day's food entries. */
export function sumMicros(entries: readonly FoodEntry[]): MicroTotals {
  const tot: MicroTotals = {
    fiber: 0,
    potassium: 0,
    calcium: 0,
    iron: 0,
    vitc: 0,
    sugar: 0,
    satfat: 0,
    sodium: 0,
  };
  for (const e of entries) {
    tot.fiber += num(e.fiber);
    tot.potassium += num(e.potassium);
    tot.calcium += num(e.calcium);
    tot.iron += num(e.iron);
    tot.vitc += num(e.vitc);
    tot.sugar += num(e.sugar);
    tot.satfat += num(e.satfat);
    tot.sodium += num(e.sodium);
  }
  return tot;
}

export interface MicroStatus {
  /** Fill fraction 0–1 (capped). */
  pct: number;
  /** A limit nutrient that has gone over its ceiling. */
  over: boolean;
  /** A goal nutrient that has met its target. */
  met: boolean;
}

export function microStatus(def: MicroDef, value: number): MicroStatus {
  const target = def.target > 0 ? def.target : 1;
  const ratio = value / target;
  return {
    pct: Math.max(0, Math.min(1, ratio)),
    over: def.kind === 'limit' && value > def.target,
    met: def.kind === 'goal' && value >= def.target,
  };
}
