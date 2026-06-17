/**
 * Pure helpers for the progress-photo gallery. Photos are stored newest-first
 * and capped at MAX_PHOTOS so the base64 images can't grow the localStorage
 * payload without bound. All functions are pure and return new arrays.
 */
import type { ProgressPhoto } from '@/types/schemas';

/** Hard cap on retained photos — keeps the persisted payload bounded. */
export const MAX_PHOTOS = 12;

export function newPhotoId(): string {
  return `ph:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Prepend a new photo (newest first) and trim to the cap. */
export function addPhoto(list: readonly ProgressPhoto[], photo: ProgressPhoto): ProgressPhoto[] {
  return [photo, ...list].slice(0, MAX_PHOTOS);
}

export function removePhoto(list: readonly ProgressPhoto[], id: string): ProgressPhoto[] {
  return list.filter((p) => p.id !== id);
}

/** True once the gallery is at capacity. */
export function isFull(list: readonly ProgressPhoto[]): boolean {
  return list.length >= MAX_PHOTOS;
}

/** Oldest and newest photos for a before/after comparison (null if <2). */
export function comparePair(
  list: readonly ProgressPhoto[],
): { first: ProgressPhoto; latest: ProgressPhoto } | null {
  if (list.length < 2) return null;
  const latest = list[0];
  const first = list[list.length - 1];
  if (!latest || !first) return null;
  return { first, latest };
}
