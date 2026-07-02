import { describe, it, expect } from 'vitest';
import { coachInsights, achievements, type CoachData } from './insights';
import type { Profile } from '@/types/schemas';

const NOW = new Date('2026-06-16T12:00:00Z');

const makeProfile = (over: Partial<Profile> = {}): Profile => ({
  name: 'Test',
  sex: 'm',
  age: 30,
  height: 180,
  weight: 80,
  targetWeight: 75,
  weightUnit: 'kg',
  heightUnit: 'cm',
  goal: 'maintain',
  activity: 'moderate',
  experience: 'beginner',
  allergies: [],
  dislikes: [],
  ...over,
});

const titles = (data: CoachData) => coachInsights(data, NOW).map((i) => i.title);

describe('coachInsights', () => {
  it('returns nothing without a profile', () => {
    expect(coachInsights({ profile: null }, NOW)).toEqual([]);
  });

  it('shows an onboarding nudge when there is no history', () => {
    const out = coachInsights({ profile: makeProfile() }, NOW);
    expect(out).toHaveLength(1);
    expect(out[0]?.title).toBe("Let's begin");
  });

  it('shows a "keep it rolling" nudge once a workout exists but nothing else fires', () => {
    const out = coachInsights(
      { profile: makeProfile(), done: [{ d: '2026-05-01', day: 'Push' }] },
      NOW,
    );
    expect(out[0]?.title).toBe('Keep it rolling');
  });

  it('celebrates a 3+ day streak', () => {
    const done = [
      { d: '2026-06-16', day: 'A' },
      { d: '2026-06-15', day: 'B' },
      { d: '2026-06-14', day: 'C' },
    ];
    expect(titles({ profile: makeProfile(), done })).toContain('3-day streak');
  });

  it('flags rising estimated 1RM', () => {
    const lifts = {
      'Barbell Bench Press': [
        { d: '2026-06-01', w: 60, e1rm: 100 },
        { d: '2026-06-10', w: 70, e1rm: 120 },
      ],
    };
    expect(titles({ profile: makeProfile(), lifts })).toContain('Barbell Bench Press +20%');
  });

  it('flags a dipping lift', () => {
    const lifts = {
      Squat: [
        { d: '2026-06-01', w: 100, e1rm: 100 },
        { d: '2026-06-10', w: 90, e1rm: 90 },
      ],
    };
    expect(titles({ profile: makeProfile(), lifts })).toContain('Squat dipped');
  });

  it('flags a low-protein day', () => {
    const foodLog = {
      '2026-06-16': [
        { meal: 'lunch', name: 'Salad', kcal: 200, p: 8, c: 20, f: 8 },
        { meal: 'dinner', name: 'Toast', kcal: 200, p: 6, c: 30, f: 4 },
      ],
    };
    expect(titles({ profile: makeProfile(), foodLog })).toContain("Protein's running low");
  });

  it('notes weight trending toward goal (cut)', () => {
    const weights = [
      { d: '2026-05-01', w: 82 },
      { d: '2026-06-15', w: 80 },
    ];
    expect(titles({ profile: makeProfile({ goal: 'lose' }), weights })).toContain(
      'Trending to goal',
    );
  });

  it('notes weight trending toward goal (bulk)', () => {
    const weights = [
      { d: '2026-05-01', w: 78 },
      { d: '2026-06-15', w: 80 },
    ];
    expect(titles({ profile: makeProfile({ goal: 'gain' }), weights })).toContain(
      'Trending to goal',
    );
  });

  it('notes weight trending toward goal (maintain — closer to target)', () => {
    const weights = [
      { d: '2026-05-01', w: 80 },
      { d: '2026-06-15', w: 77 },
    ];
    expect(
      titles({ profile: makeProfile({ goal: 'maintain', targetWeight: 75 }), weights }),
    ).toContain('Trending to goal');
  });

  it('does not flag weight that is moving away from a maintain target', () => {
    const weights = [
      { d: '2026-05-01', w: 76 },
      { d: '2026-06-15', w: 80 },
    ];
    expect(
      titles({ profile: makeProfile({ goal: 'maintain', targetWeight: 75 }), weights }),
    ).not.toContain('Trending to goal');
  });

  it('flags an unbalanced training week', () => {
    const done = [
      { d: '2026-06-15', day: 'Arms', muscles: { Biceps: 6 } },
      { d: '2026-06-16', day: 'Arms', muscles: { Biceps: 6 } },
    ];
    expect(titles({ profile: makeProfile(), done })).toContain('Balance your week');
  });

  it('suggests a rest day after 6+ sessions in 7 days', () => {
    const done = ['10', '11', '12', '13', '14', '15'].map((d) => ({ d: `2026-06-${d}`, day: 'X' }));
    expect(titles({ profile: makeProfile(), done })).toContain('Take a rest day');
  });

  it('caps output at three insights', () => {
    const done = ['10', '11', '12', '13', '14', '15', '16'].map((d) => ({
      d: `2026-06-${d}`,
      day: 'X',
      muscles: { Biceps: 6 },
    }));
    const weights = [
      { d: '2026-05-01', w: 82 },
      { d: '2026-06-15', w: 80 },
    ];
    expect(
      coachInsights({ profile: makeProfile({ goal: 'lose' }), done, weights }, NOW).length,
    ).toBeLessThanOrEqual(3);
  });
});

describe('achievements', () => {
  it('returns the full list with nothing unlocked for empty data', () => {
    const list = achievements({ profile: null });
    expect(list).toHaveLength(9);
    expect(list.every((a) => !a.got)).toBe(true);
  });

  it('unlocks "First Rep" after one workout', () => {
    const list = achievements({ profile: makeProfile(), done: [{ d: '2026-06-16', day: 'A' }] });
    expect(list.find((a) => a.id === 'first')?.got).toBe(true);
  });

  it('unlocks the 7-day streak achievement', () => {
    const done = ['10', '11', '12', '13', '14', '15', '16'].map((d) => ({
      d: `2026-06-${d}`,
      day: 'X',
    }));
    expect(
      achievements({ profile: makeProfile(), done }).find((a) => a.id === 'streak7')?.got,
    ).toBe(true);
  });

  it('counts PRs from rising e1RM', () => {
    const lifts = {
      Bench: [
        { d: '1', w: 60, e1rm: 60 },
        { d: '2', w: 70, e1rm: 70 },
        { d: '3', w: 65, e1rm: 65 },
        { d: '4', w: 80, e1rm: 80 },
      ],
    };
    const list = achievements({ profile: makeProfile(), lifts });
    expect(list.find((a) => a.id === 'pr1')?.got).toBe(true); // 2 PRs (70, 80)
    expect(list.find((a) => a.id === 'pr5')?.got).toBe(false);
  });

  it('unlocks set milestones from total sets', () => {
    const done = Array.from({ length: 10 }, (_, i) => ({
      d: `2026-04-${10 + i}`,
      day: 'X',
      sets: 12,
    }));
    const list = achievements({ profile: makeProfile(), done });
    expect(list.find((a) => a.id === 'sets100')?.got).toBe(true); // 120 sets
    expect(list.find((a) => a.id === 'sets500')?.got).toBe(false);
  });

  it('unlocks the goal-weight achievement for a cut', () => {
    const list = achievements({
      profile: makeProfile({ goal: 'lose', targetWeight: 75 }),
      weights: [{ d: '2026-06-15', w: 74 }],
    });
    expect(list.find((a) => a.id === 'goal')?.got).toBe(true);
  });

  it('unlocks the goal-weight achievement for a bulk', () => {
    const list = achievements({
      profile: makeProfile({ goal: 'gain', targetWeight: 80 }),
      weights: [{ d: '2026-06-15', w: 82 }],
    });
    expect(list.find((a) => a.id === 'goal')?.got).toBe(true);
  });

  it('unlocks the goal-weight achievement when maintaining near target', () => {
    const list = achievements({
      profile: makeProfile({ goal: 'maintain', targetWeight: 75 }),
      weights: [{ d: '2026-06-15', w: 75.3 }],
    });
    expect(list.find((a) => a.id === 'goal')?.got).toBe(true);
  });

  it('does not unlock the goal achievement when still far away', () => {
    const list = achievements({
      profile: makeProfile({ goal: 'lose', targetWeight: 75 }),
      weights: [{ d: '2026-06-15', w: 90 }],
    });
    expect(list.find((a) => a.id === 'goal')?.got).toBe(false);
  });
});
