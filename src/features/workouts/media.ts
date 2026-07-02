import MEDIA from './exercise-media.json';

/**
 * Bundled, license-clean exercise demo images (public domain). The actual JPGs
 * live in `public/exercises/<slug>-1.jpg` (start) and `<slug>-2.jpg` (finish)
 * and are downloaded by `npm run fetch:exercise-media` (see
 * scripts/fetch-exercise-media.mjs); `exercise-media.json` lists the slugs that
 * have a demo, so the UI never renders a broken `<img>`. Until the fetch is run
 * the manifest is empty and the app falls back to the YouTube thumbnail.
 */

/** Filename-safe slug for an exercise's bundled demo images. */
export function exerciseSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface ExerciseFrames {
  /** Starting position. */
  start: string;
  /** Finishing position (the other end of the movement). */
  finish: string;
}

/** The two demo frames (start + finish) for an exercise, respecting the deploy base. */
export function exerciseFrames(name: string): ExerciseFrames {
  const base = `${import.meta.env.BASE_URL}exercises/${exerciseSlug(name)}`;
  return { start: `${base}-1.jpg`, finish: `${base}-2.jpg` };
}

const SLUGS = new Set<string>(MEDIA);

/** Whether a bundled demo exists for this exercise. */
export function hasExerciseImage(name: string, slugs: ReadonlySet<string> = SLUGS): boolean {
  return slugs.has(exerciseSlug(name));
}
