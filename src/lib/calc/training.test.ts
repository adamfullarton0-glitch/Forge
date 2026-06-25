import { describe, it, expect } from 'vitest';
import { platesFor, e1rm, topRepOf, setsOf, BAR_KG } from './training';

describe('platesFor', () => {
  it('returns nothing for an empty or sub-bar load', () => {
    expect(platesFor(BAR_KG)).toEqual([]);
    expect(platesFor(0)).toEqual([]);
    expect(platesFor(10)).toEqual([]);
  });

  it('loads the greedy (heaviest-first) plate combination per side', () => {
    expect(platesFor(100)).toEqual([25, 15]); // (100-20)/2 = 40 = 25+15
    expect(platesFor(60)).toEqual([20]); // (60-20)/2 = 20
    expect(platesFor(25)).toEqual([2.5]); // (25-20)/2 = 2.5
  });

  it('uses fractional plates and stays exact', () => {
    expect(platesFor(22.5)).toEqual([1.25]);
    expect(platesFor(102.5)).toEqual([25, 15, 1.25]);
  });

  it('respects a custom bar weight', () => {
    expect(platesFor(60, 0)).toEqual([25, 5]); // 30 per side
  });

  it('guards non-finite input', () => {
    expect(platesFor(NaN)).toEqual([]);
    expect(platesFor(100, Infinity)).toEqual([]);
  });
});

describe('e1rm', () => {
  it('returns the weight itself for 1 or fewer reps', () => {
    expect(e1rm(100, 1)).toBe(100);
    expect(e1rm(100, 0)).toBe(100);
  });

  it('applies the Epley formula for multiple reps', () => {
    expect(e1rm(100, 5)).toBe(117); // 100 * (1 + 5/30) = 116.67 -> 117
    expect(e1rm(60, 8)).toBe(76);
  });

  it('guards non-finite input', () => {
    expect(e1rm(NaN, 5)).toBe(0);
    expect(e1rm(100, NaN)).toBe(0);
  });
});

describe('topRepOf', () => {
  it('extracts the top of a rep range', () => {
    expect(topRepOf('4 × 6–8')).toBe(8);
    expect(topRepOf('3 × 12–15')).toBe(15);
    expect(topRepOf('3 × max reps')).toBe(3);
  });

  it('defaults to 12 when there is no number', () => {
    expect(topRepOf('max reps')).toBe(12);
    expect(topRepOf('')).toBe(12);
  });

  it('clamps absurd free-text rep counts to a sane bound', () => {
    // A custom routine could carry adversarial sets×reps text.
    expect(topRepOf('3 × 999999999999')).toBe(100);
    expect(topRepOf('3 × 0')).toBe(12);
  });
});

describe('setsOf', () => {
  it('reads the prescribed set count from the leading number', () => {
    expect(setsOf('4 × 6–8')).toBe(4);
    expect(setsOf('3 × 12–15')).toBe(3);
    expect(setsOf('5 × 5')).toBe(5);
  });

  it('defaults to 3 and clamps to a sane range', () => {
    expect(setsOf('')).toBe(3);
    expect(setsOf('max reps')).toBe(3);
    expect(setsOf('99 × 5')).toBe(10);
  });
});
