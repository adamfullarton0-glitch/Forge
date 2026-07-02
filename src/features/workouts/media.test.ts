import { describe, it, expect } from 'vitest';
import { exerciseSlug, exerciseFrames, hasExerciseImage } from './media';

describe('exerciseSlug', () => {
  it('makes a filename-safe slug', () => {
    expect(exerciseSlug('Barbell Bench Press')).toBe('barbell-bench-press');
    expect(exerciseSlug('Push-Up')).toBe('push-up');
    expect(exerciseSlug('Dumbbell Romanian Deadlift')).toBe('dumbbell-romanian-deadlift');
  });
});

describe('exerciseFrames', () => {
  it('points at the bundled start + finish frames under the deploy base', () => {
    // import.meta.env.BASE_URL is '/' in the test env.
    expect(exerciseFrames('Barbell Bench Press')).toEqual({
      start: '/exercises/barbell-bench-press-1.jpg',
      finish: '/exercises/barbell-bench-press-2.jpg',
    });
  });
});

describe('hasExerciseImage', () => {
  it('is true for a bundled exercise and false for an unknown one', () => {
    // The manifest is populated by `npm run fetch:exercise-media`.
    expect(hasExerciseImage('Barbell Bench Press')).toBe(true);
    expect(hasExerciseImage('Some Made-Up Lift')).toBe(false);
  });

  it('honours a provided manifest', () => {
    const slugs = new Set(['barbell-bench-press']);
    expect(hasExerciseImage('Barbell Bench Press', slugs)).toBe(true);
    expect(hasExerciseImage('Deadlift', slugs)).toBe(false);
  });
});
