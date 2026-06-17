import { describe, it, expect } from 'vitest';
import { addPhoto, removePhoto, isFull, comparePair, newPhotoId, MAX_PHOTOS } from './photos';
import type { ProgressPhoto } from '@/types/schemas';

const mk = (id: string, d = '2026-01-01'): ProgressPhoto => ({ id, d, src: `data:,${id}` });

describe('addPhoto', () => {
  it('prepends newest-first', () => {
    const list = addPhoto([mk('a')], mk('b'));
    expect(list.map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('caps the gallery at MAX_PHOTOS, dropping the oldest', () => {
    let list: ProgressPhoto[] = [];
    for (let i = 0; i < MAX_PHOTOS + 5; i++) list = addPhoto(list, mk(`p${i}`));
    expect(list).toHaveLength(MAX_PHOTOS);
    // The 5 oldest were dropped; the newest is first.
    expect(list[0]?.id).toBe(`p${MAX_PHOTOS + 4}`);
    expect(list.some((p) => p.id === 'p0')).toBe(false);
  });
});

describe('removePhoto', () => {
  it('removes by id', () => {
    expect(removePhoto([mk('a'), mk('b')], 'a').map((p) => p.id)).toEqual(['b']);
  });
});

describe('isFull', () => {
  it('is true only at the cap', () => {
    expect(isFull([])).toBe(false);
    expect(isFull(Array.from({ length: MAX_PHOTOS }, (_, i) => mk(`p${i}`)))).toBe(true);
  });
});

describe('comparePair', () => {
  it('returns null with fewer than two photos', () => {
    expect(comparePair([])).toBeNull();
    expect(comparePair([mk('a')])).toBeNull();
  });

  it('pairs the oldest (last) with the newest (first)', () => {
    const list = [mk('new', '2026-03-01'), mk('mid', '2026-02-01'), mk('old', '2026-01-01')];
    const pair = comparePair(list);
    expect(pair?.first.id).toBe('old');
    expect(pair?.latest.id).toBe('new');
  });
});

describe('newPhotoId', () => {
  it('generates unique prefixed ids', () => {
    const a = newPhotoId();
    expect(a.startsWith('ph:')).toBe(true);
    expect(newPhotoId()).not.toBe(a);
  });
});
