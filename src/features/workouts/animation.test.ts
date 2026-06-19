import { describe, it, expect } from 'vitest';
import { moveTypeOf, MOVE_LABEL, allExercisesMapped } from './animation';
import { EXERCISE_NAMES } from './exercises';

describe('moveTypeOf', () => {
  it('maps lifts to the expected movement archetype', () => {
    expect(moveTypeOf('Barbell Back Squat')).toBe('squat');
    expect(moveTypeOf('Romanian Deadlift')).toBe('hinge');
    expect(moveTypeOf('Overhead Press')).toBe('pressUp');
    expect(moveTypeOf('Barbell Bench Press')).toBe('pressFwd');
    expect(moveTypeOf('Pull-Up')).toBe('pullDown');
    expect(moveTypeOf('Barbell Curl')).toBe('curl');
    expect(moveTypeOf('Plank')).toBe('core');
  });

  it('falls back to a horizontal press for an unknown movement', () => {
    expect(moveTypeOf('Nonexistent Lift')).toBe('pressFwd');
  });

  it('every bundled exercise has an explicit archetype + label', () => {
    expect(allExercisesMapped()).toBe(true);
    for (const name of EXERCISE_NAMES) {
      expect(MOVE_LABEL[moveTypeOf(name)]).toBeTruthy();
    }
  });
});
