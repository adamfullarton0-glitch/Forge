import { describe, it, expect } from 'vitest';
import { kg2lb, lb2kg, cm2ftin, ftin2cm, getUnits } from './units';

describe('weight conversions', () => {
  it('converts kg to lb and back (round-trip stable to 0.1)', () => {
    expect(kg2lb(100)).toBeCloseTo(220.5, 1);
    expect(lb2kg(220.46)).toBeCloseTo(100, 0);
    expect(kg2lb(0)).toBe(0);
  });

  it('handles negative and huge values', () => {
    expect(kg2lb(-10)).toBeCloseTo(-22, 0);
    expect(kg2lb(1_000_000)).toBeGreaterThan(0);
  });

  it('treats non-finite input as zero', () => {
    expect(kg2lb(NaN)).toBe(0);
    expect(lb2kg(Infinity)).toBe(0);
  });
});

describe('height conversions', () => {
  it('converts cm to feet + inches', () => {
    expect(cm2ftin(180)).toEqual({ ft: 5, inch: 11 });
    expect(cm2ftin(0)).toEqual({ ft: 0, inch: 0 });
  });

  it('never returns a negative inch remainder', () => {
    const { inch } = cm2ftin(30.48); // ~12in -> 1ft 0in
    expect(inch).toBeGreaterThanOrEqual(0);
  });

  it('converts feet + inches to cm', () => {
    expect(ftin2cm(5, 11)).toBe(180);
    expect(ftin2cm(6, 0)).toBe(183);
    expect(ftin2cm(0, 0)).toBe(0);
  });
});

describe('getUnits', () => {
  it('prefers explicit unit fields', () => {
    expect(getUnits({ weightUnit: 'lb', heightUnit: 'ftin' })).toEqual({ wu: 'lb', hu: 'ftin' });
  });

  it('falls back to the legacy `units` field', () => {
    expect(getUnits({ units: 'imperial' })).toEqual({ wu: 'lb', hu: 'ftin' });
    expect(getUnits({ units: 'metric' })).toEqual({ wu: 'kg', hu: 'cm' });
  });

  it('defaults to metric when nothing is set', () => {
    expect(getUnits({})).toEqual({ wu: 'kg', hu: 'cm' });
  });
});
