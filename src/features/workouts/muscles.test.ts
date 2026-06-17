import { describe, it, expect } from 'vitest';
import { MUSCLE_GROUPS, trains, exercisesForMuscle, muscleCounts } from './muscles';

describe('trains', () => {
  it('matches an exercise to the muscles in its description', () => {
    expect(trains('Barbell Bench Press', 'chest')).toBe(true);
    expect(trains('Barbell Bench Press', 'triceps')).toBe(true);
    expect(trains('Barbell Bench Press', 'quads')).toBe(false);
  });

  it('maps posterior-chain lifts to glutes and hamstrings', () => {
    expect(trains('Deadlift', 'glutes')).toBe(true);
    expect(trains('Deadlift', 'hamstrings')).toBe(true);
  });
});

describe('exercisesForMuscle', () => {
  it('returns the exercises that train a group', () => {
    const chest = exercisesForMuscle('chest');
    expect(chest).toContain('Barbell Bench Press');
    expect(chest).toContain('Push-Up');
    expect(chest).not.toContain('Lying Leg Curl');
  });

  it('returns a non-empty list for every group', () => {
    for (const g of MUSCLE_GROUPS) {
      expect(exercisesForMuscle(g.id).length).toBeGreaterThan(0);
    }
  });
});

describe('muscleCounts', () => {
  it('counts every group and agrees with exercisesForMuscle', () => {
    const counts = muscleCounts();
    for (const g of MUSCLE_GROUPS) {
      expect(counts[g.id]).toBe(exercisesForMuscle(g.id).length);
    }
  });
});
