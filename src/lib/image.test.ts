import { describe, it, expect } from 'vitest';
import { scaleToFit } from './image';

describe('scaleToFit', () => {
  it('shrinks a landscape image to the longest-edge cap', () => {
    expect(scaleToFit(2000, 1000, 720)).toEqual({ width: 720, height: 360 });
  });

  it('shrinks a portrait image to the longest-edge cap', () => {
    expect(scaleToFit(1000, 2000, 720)).toEqual({ width: 360, height: 720 });
  });

  it('never upscales a small image', () => {
    expect(scaleToFit(300, 200, 720)).toEqual({ width: 300, height: 200 });
  });

  it('returns zero for invalid dimensions', () => {
    expect(scaleToFit(0, 100, 720)).toEqual({ width: 0, height: 0 });
    expect(scaleToFit(NaN, 100, 720)).toEqual({ width: 0, height: 0 });
  });
});
