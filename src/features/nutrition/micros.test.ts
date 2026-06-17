import { describe, it, expect } from 'vitest';
import { MICROS, sumMicros, microStatus } from './micros';
import type { FoodEntry } from '@/types/schemas';

const entry = (patch: Partial<FoodEntry>): FoodEntry => ({
  meal: 'lunch',
  kcal: 0,
  p: 0,
  c: 0,
  f: 0,
  ...patch,
});

describe('sumMicros', () => {
  it('adds every tracked micronutrient across entries', () => {
    const tot = sumMicros([
      entry({ fiber: 5, sodium: 300, iron: 4, vitc: 20 }),
      entry({ fiber: 8, sodium: 200, iron: 2, calcium: 150 }),
    ]);
    expect(tot.fiber).toBe(13);
    expect(tot.sodium).toBe(500);
    expect(tot.iron).toBe(6);
    expect(tot.vitc).toBe(20);
    expect(tot.calcium).toBe(150);
  });

  it('treats missing/invalid values as zero', () => {
    const tot = sumMicros([entry({ fiber: undefined, sodium: NaN })]);
    expect(tot.fiber).toBe(0);
    expect(tot.sodium).toBe(0);
  });
});

describe('microStatus', () => {
  const fiber = MICROS.find((m) => m.key === 'fiber')!;
  const sodium = MICROS.find((m) => m.key === 'sodium')!;

  it('marks a goal nutrient met once it reaches target', () => {
    expect(microStatus(fiber, 30).met).toBe(true);
    expect(microStatus(fiber, 29).met).toBe(false);
    expect(microStatus(fiber, 15).pct).toBeCloseTo(0.5);
  });

  it('marks a limit nutrient over once it exceeds the ceiling', () => {
    expect(microStatus(sodium, 2400).over).toBe(true);
    expect(microStatus(sodium, 2300).over).toBe(false);
  });

  it('caps the fill fraction at 1', () => {
    expect(microStatus(sodium, 9000).pct).toBe(1);
  });
});
