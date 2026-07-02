/** Calorie + macro targets and the maintenance/cut/bulk guide. All pure. */

export interface TargetsProfile {
  sex: 'm' | 'f';
  weight: number; // kg
  height: number; // cm
  age: number;
  goal?: 'lose' | 'maintain' | 'gain';
  activity?: string;
}

export interface Targets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const ACTIVITY: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

const DEFAULT_TARGETS: Targets = { kcal: 2200, protein: 150, carbs: 230, fat: 65 };

function mifflinBmr(p: TargetsProfile): number {
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  return p.sex === 'm' ? base + 5 : base - 161;
}

/** Daily calorie + macro targets from profile stats and goal. */
export function calcTargets(p: TargetsProfile | null | undefined): Targets {
  if (!p) return { ...DEFAULT_TARGETS };
  const act = ACTIVITY[p.activity ?? ''] ?? 1.4;
  let kcal = mifflinBmr(p) * act;
  if (p.goal === 'lose') kcal -= 450;
  if (p.goal === 'gain') kcal += 300;
  if (!Number.isFinite(kcal)) return { ...DEFAULT_TARGETS };
  kcal = Math.max(1200, Math.round(kcal));
  const protein = Math.round(1.8 * p.weight);
  const fat = Math.round((kcal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat };
}

export interface CalorieGuide {
  maintenance: number;
  cut: number;
  leanBulk: number;
  aggressiveBulk: number;
}

/** Maintenance + cut/lean-bulk/aggressive-bulk targets, rounded to 10 kcal. */
export function calorieGuide(p: TargetsProfile | null | undefined): CalorieGuide | null {
  if (!p) return null;
  const act = ACTIVITY[p.activity ?? ''] ?? 1.4;
  const raw = mifflinBmr(p) * act;
  if (!Number.isFinite(raw)) return null;
  const maintenance = Math.max(1200, Math.round(raw / 10) * 10);
  const r = (k: number) => Math.max(1200, Math.round(k / 10) * 10);
  // Cut/lean-bulk use the SAME offsets as calcTargets (−450/+300) so the
  // guide's highlighted number matches the tracker's target on the same screen.
  return {
    maintenance,
    cut: r(maintenance - 450),
    leanBulk: r(maintenance + 300),
    aggressiveBulk: r(maintenance + 500),
  };
}
