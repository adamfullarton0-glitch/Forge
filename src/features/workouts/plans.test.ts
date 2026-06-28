import { describe, it, expect } from 'vitest';
import {
  getPlan,
  planSr,
  resolvePlanId,
  isCustomPlanId,
  newCustomPlanId,
  DEFAULT_PLAN_ID,
  PLAN_CATALOGUE,
  PLAN_LEVELS,
} from './plans';
import { getExercise } from './exercises';
import type { CustomPlan } from '@/types/schemas';

const routine: CustomPlan = {
  id: 'custom:abc',
  name: 'My Split',
  days: [{ name: 'Day A', ex: ['Barbell Bench Press', 'Pull-Up'] }],
  sr: { 'Barbell Bench Press': '5 × 5' },
};

describe('getPlan', () => {
  it('returns a built-in plan by id', () => {
    expect(getPlan('ppl').name).toBe('Push / Pull / Legs');
  });

  it('falls back to PPL for an unknown id', () => {
    expect(getPlan('nope').name).toBe(getPlan(DEFAULT_PLAN_ID).name);
  });

  it('resolves a custom routine from the provided list', () => {
    const p = getPlan('custom:abc', [routine]);
    expect(p.name).toBe('My Split');
    expect(p.custom).toBe(true);
    expect(p.days[0]?.ex).toEqual(['Barbell Bench Press', 'Pull-Up']);
    expect(p.tag).toMatch(/custom/);
  });
});

describe('planSr', () => {
  it('uses the custom override when present', () => {
    const p = getPlan('custom:abc', [routine]);
    expect(planSr(p, 'Barbell Bench Press')).toBe('5 × 5');
  });

  it('falls back to the exercise default scheme', () => {
    const p = getPlan('custom:abc', [routine]);
    expect(planSr(p, 'Pull-Up')).toBe(getExercise('Pull-Up')?.sr);
    expect(planSr(getPlan('ppl'), 'Barbell Bench Press')).toBe(
      getExercise('Barbell Bench Press')?.sr,
    );
  });
});

describe('custom plan ids', () => {
  it('detects + generates custom ids', () => {
    expect(isCustomPlanId('ppl')).toBe(false);
    const id = newCustomPlanId();
    expect(isCustomPlanId(id)).toBe(true);
    expect(newCustomPlanId()).not.toBe(id);
  });
});

describe('PLAN_CATALOGUE', () => {
  it('lists every built-in plan and imported program with filter metadata', () => {
    // Built-ins plus the imported library — far more than the 10 built-ins alone.
    expect(PLAN_CATALOGUE.length).toBeGreaterThan(20);
    expect(PLAN_CATALOGUE.some((e) => e.id === 'ppl')).toBe(true);
  });

  it('derives a positive day count from the plan itself', () => {
    for (const e of PLAN_CATALOGUE) {
      expect(e.days).toBe(e.plan.days.length);
      expect(e.days).toBeGreaterThan(0);
    }
  });

  it('only ever assigns a known level (or null for all-level plans)', () => {
    for (const e of PLAN_CATALOGUE) {
      expect(e.level === null || PLAN_LEVELS.includes(e.level)).toBe(true);
    }
    // PPL is curated as a beginner-friendly default.
    expect(PLAN_CATALOGUE.find((e) => e.id === 'ppl')?.level).toBe('beginner');
  });
});

describe('resolvePlanId', () => {
  it('keeps a known built-in id', () => {
    expect(resolvePlanId('ppl')).toBe('ppl');
  });

  it('keeps an existing custom id', () => {
    expect(resolvePlanId('custom:abc', [routine])).toBe('custom:abc');
  });

  it('falls back to the default for a deleted/unknown id', () => {
    expect(resolvePlanId('custom:gone', [])).toBe(DEFAULT_PLAN_ID);
    expect(resolvePlanId('nope')).toBe(DEFAULT_PLAN_ID);
  });
});
