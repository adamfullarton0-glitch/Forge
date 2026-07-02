import { describe, it, expect } from 'vitest';
import { EX, EXERCISE_NAMES, getExercise, ytSearch } from './exercises';
import { PLANS, EQUIPMENT } from './plans';

const validEquip = new Set(EQUIPMENT.map(([id]) => id));

describe('exercise database integrity', () => {
  it('has a full library of exercises', () => {
    expect(EXERCISE_NAMES.length).toBeGreaterThanOrEqual(30);
  });

  it('gives every exercise the required fields', () => {
    for (const [name, ex] of Object.entries(EX)) {
      expect(ex.m, `${name} muscles`).toBeTruthy();
      expect(ex.sr, `${name} sets/reps`).toBeTruthy();
      expect(ex.steps.length, `${name} steps`).toBeGreaterThan(0);
      expect(ex.tip, `${name} tip`).toBeTruthy();
      expect(Array.isArray(ex.eq)).toBe(true);
      expect(Array.isArray(ex.alt)).toBe(true);
    }
  });

  it('only references valid equipment ids', () => {
    for (const [name, ex] of Object.entries(EX)) {
      for (const e of ex.eq) {
        expect(validEquip.has(e), `${name} uses unknown equipment "${e}"`).toBe(true);
      }
    }
  });

  it('only lists alternatives that exist in the database', () => {
    for (const [name, ex] of Object.entries(EX)) {
      for (const alt of ex.alt) {
        expect(EX[alt], `${name} alt "${alt}" missing`).toBeDefined();
      }
    }
  });

  it('references only real exercises from every plan', () => {
    for (const plan of Object.values(PLANS)) {
      for (const day of plan.days) {
        for (const name of day.ex) {
          expect(EX[name], `plan exercise "${name}" missing`).toBeDefined();
        }
      }
    }
  });

  it('getExercise returns undefined for unknown names', () => {
    expect(getExercise('Nonexistent Lift')).toBeUndefined();
  });

  it('ytSearch builds an encoded search url', () => {
    expect(ytSearch('Barbell Bench Press')).toContain('youtube.com/results');
    expect(ytSearch('Barbell Bench Press')).toContain('Barbell%20Bench%20Press');
  });
});
