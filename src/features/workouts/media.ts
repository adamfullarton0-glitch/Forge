import MEDIA from './exercise-media.json';

/**
 * Bundled, license-clean exercise demo images (public domain). The actual JPGs
 * live in `public/exercises/<slug>.jpg` and are downloaded by
 * `npm run fetch:exercise-media` (see scripts/fetch-exercise-media.mjs);
 * `exercise-media.json` lists the slugs that have an image, so the UI never
 * renders a broken `<img>`. Until the fetch is run the manifest is empty and
 * the app falls back to the YouTube thumbnail.
 */

/** Filename-safe slug for an exercise's bundled demo image. */
export function exerciseSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Path to an exercise's bundled demo image (respects the deploy base path). */
export function exerciseImage(name: string): string {
  return `${import.meta.env.BASE_URL}exercises/${exerciseSlug(name)}.jpg`;
}

const SLUGS = new Set<string>(MEDIA);

/** Whether a bundled demo image exists for this exercise. */
export function hasExerciseImage(name: string, slugs: ReadonlySet<string> = SLUGS): boolean {
  return slugs.has(exerciseSlug(name));
}
