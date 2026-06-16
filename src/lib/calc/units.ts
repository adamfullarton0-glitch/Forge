/** Unit conversions and unit-preference resolution. All pure. */

const finite = (n: number, fallback = 0): number => (Number.isFinite(n) ? n : fallback);

export const kg2lb = (k: number): number => Math.round(finite(k) * 2.20462 * 10) / 10;

export const lb2kg = (l: number): number => Math.round((finite(l) / 2.20462) * 10) / 10;

export const cm2ftin = (cm: number): { ft: number; inch: number } => {
  const tot = Math.round(finite(cm) / 2.54);
  return { ft: Math.floor(tot / 12), inch: ((tot % 12) + 12) % 12 };
};

export const ftin2cm = (ft: number, inch: number): number =>
  Math.round((finite(ft) * 12 + finite(inch)) * 2.54);

export type WeightUnit = 'kg' | 'lb';
export type HeightUnit = 'cm' | 'ftin';

interface UnitPrefs {
  weightUnit?: WeightUnit;
  heightUnit?: HeightUnit;
  /** Legacy single-field preference from older saves. */
  units?: 'metric' | 'imperial';
}

/** Resolves the weight + height units a profile should display in. */
export const getUnits = (p: UnitPrefs): { wu: WeightUnit; hu: HeightUnit } => ({
  wu: p.weightUnit ?? (p.units === 'imperial' ? 'lb' : 'kg'),
  hu: p.heightUnit ?? (p.units === 'imperial' ? 'ftin' : 'cm'),
});
