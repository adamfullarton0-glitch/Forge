import type { Profile, DoneEntry, LiftEntry, FoodEntry, WeightEntry } from '@/types/schemas';
import { calcTargets } from './nutrition';
import { computeStreak } from './streak';
import { todayKey, weekStartKey, daysAgoKey } from './dates';
import { getUnits, kg2lb } from './units';

export interface CoachData {
  profile: Profile | null;
  done?: DoneEntry[];
  lifts?: Record<string, LiftEntry[]>;
  foodLog?: Record<string, FoodEntry[]>;
  weights?: WeightEntry[];
}

export interface Insight {
  icon: string;
  title: string;
  text: string;
}

/** Up to three coaching insights derived from training + nutrition data. */
export function coachInsights(data: CoachData, now: Date = new Date()): Insight[] {
  const out: Insight[] = [];
  const p = data.profile;
  if (!p) return out;

  const done = data.done ?? [];
  const lifts = data.lifts ?? {};

  const streak = computeStreak(done, now);
  if (streak >= 3) {
    out.push({
      icon: 'flame',
      title: `${streak}-day streak`,
      text: 'Consistency is the whole game. Keep showing up.',
    });
  }

  // Biggest-progress lift.
  let bestLift: string | null = null;
  let bestLen = 0;
  for (const k of Object.keys(lifts)) {
    const len = (lifts[k] ?? []).length;
    if (len > bestLen) {
      bestLen = len;
      bestLift = k;
    }
  }
  if (bestLift && bestLen >= 2) {
    const arr = lifts[bestLift] ?? [];
    const first = arr[0]?.e1rm ?? 0;
    const last = arr[arr.length - 1]?.e1rm ?? 0;
    if (first > 0) {
      const pct = Math.round(((last - first) / first) * 100);
      if (pct >= 2) {
        out.push({
          icon: 'chart',
          title: `${bestLift} +${pct}%`,
          text: 'Your estimated 1RM is climbing. Progressive overload is working.',
        });
      } else if (pct <= -3) {
        out.push({
          icon: 'chart',
          title: `${bestLift} dipped`,
          text: 'Down a touch — likely fatigue. Consider a lighter day or extra sleep.',
        });
      }
    }
  }

  // Weekly muscle balance.
  const ws = weekStartKey(now);
  const wk = done.filter((x) => x.d >= ws);
  const mus: Record<string, number> = {};
  wk.forEach((x) =>
    Object.entries(x.muscles ?? {}).forEach(([k, v]) => {
      mus[k] = (mus[k] ?? 0) + v;
    }),
  );
  const groups = Object.keys(mus);
  if (groups.length > 0 && wk.length >= 2) {
    const top = Object.entries(mus).sort((a, b) => b[1] - a[1])[0];
    // Recorded muscle names are the exercises' prime movers ("Lats", "Side
    // delts", "Upper chest"…), so match each major group by keyword — an exact
    // name check would claim "no back" right after a full pull day.
    const majors: Array<[string, string[]]> = [
      ['chest', ['chest']],
      ['back', ['back', 'lat', 'trap']],
      ['quads', ['quad']],
      ['hamstrings', ['hamstring', 'posterior chain']],
      ['shoulders', ['delt', 'shoulder']],
    ];
    const trained = groups.map((g) => g.toLowerCase());
    const missing = majors.find(([, kws]) => !trained.some((g) => kws.some((k) => g.includes(k))));
    if (missing && top) {
      out.push({
        icon: 'target',
        title: 'Balance your week',
        text: `Plenty of ${top[0].toLowerCase()} work but no ${missing[0]} yet this week.`,
      });
    }
  }

  // Protein gap today.
  const log = (data.foodLog ?? {})[todayKey(now)] ?? [];
  const tg = calcTargets(p);
  const proteinToday = Math.round(log.reduce((a, x) => a + (Number(x.p) || 0), 0));
  if (log.length >= 2 && proteinToday < tg.protein * 0.6) {
    out.push({
      icon: 'bolt',
      title: "Protein's running low",
      text: `You're at ${proteinToday} g of ${tg.protein} g today. A shake or some chicken would close the gap.`,
    });
  }

  // Trending toward goal weight.
  const w = data.weights ?? [];
  if (w.length >= 2) {
    const f = w[0]?.w ?? 0;
    const l = w[w.length - 1]?.w ?? 0;
    const toward =
      p.goal === 'lose'
        ? l < f
        : p.goal === 'gain'
          ? l > f
          : Math.abs(l - p.targetWeight) < Math.abs(f - p.targetWeight);
    const diff = Math.round(Math.abs(l - f) * 10) / 10;
    if (toward && diff >= 0.3) {
      const { wu } = getUnits(p);
      const show = wu === 'lb' ? Math.round(kg2lb(diff) * 10) / 10 : diff;
      out.push({
        icon: 'target',
        title: 'Trending to goal',
        // Word follows the actual direction of change — a maintain-goal user
        // can be trending toward target from either side.
        text: `${show} ${wu} ${l > f ? 'gained' : 'down'} since you started. Stay the course.`,
      });
    }
  }

  // Overtraining nudge.
  const last7 = done.filter((x) => x.d >= daysAgoKey(7, now));
  if (new Set(last7.map((x) => x.d)).size >= 6) {
    out.push({
      icon: 'moon',
      title: 'Take a rest day',
      text: '6+ sessions in 7 days. Recovery is when muscle is actually built.',
    });
  }

  if (out.length === 0) {
    out.push(
      done.length === 0
        ? {
            icon: 'star',
            title: "Let's begin",
            text: 'Finish your first workout and your coach insights appear here.',
          }
        : {
            icon: 'star',
            title: 'Keep it rolling',
            text: 'More insights unlock as your training and nutrition data grow.',
          },
    );
  }
  return out.slice(0, 3);
}

export interface AchievementData {
  profile: Profile | null;
  done?: DoneEntry[];
  lifts?: Record<string, LiftEntry[]>;
  weights?: WeightEntry[];
}

export interface Achievement {
  id: string;
  icon: string;
  name: string;
  desc: string;
  got: boolean;
}

const DAY_MS = 86_400_000;

/** The full achievement list with each one's unlocked state. */
export function achievements(data: AchievementData): Achievement[] {
  const done = data.done ?? [];
  const lifts = data.lifts ?? {};
  const p = data.profile;

  const totalSets = done.reduce((a, x) => a + (x.sets ?? 0), 0);

  // Best historical day streak.
  const days = [...new Set(done.map((x) => x.d))].sort();
  let best = 0;
  let cur = 0;
  let prev: string | null = null;
  for (const d of days) {
    if (prev) {
      const diff = (new Date(d).getTime() - new Date(prev).getTime()) / DAY_MS;
      cur = diff === 1 ? cur + 1 : 1;
    } else {
      cur = 1;
    }
    best = Math.max(best, cur);
    prev = d;
  }

  // PR count: any time an exercise's e1RM exceeds its previous best.
  let prs = 0;
  for (const k of Object.keys(lifts)) {
    let mx = 0;
    for (const e of lifts[k] ?? []) {
      const v = e.e1rm ?? 0;
      if (mx > 0 && v > mx) prs++;
      if (v > mx) mx = v;
    }
  }

  const w = data.weights ?? [];
  const lastW = w[w.length - 1]?.w;
  const hitGoal = !!(
    w.length > 0 &&
    p &&
    lastW != null &&
    ((p.goal === 'lose' && lastW <= p.targetWeight) ||
      (p.goal === 'gain' && lastW >= p.targetWeight) ||
      Math.abs(lastW - p.targetWeight) <= 0.5)
  );

  const defs: Array<[string, string, string, string, boolean]> = [
    ['first', 'check', 'First Rep', 'Finish your first workout', done.length >= 1],
    ['streak7', 'flame', 'On Fire', 'Reach a 7-day streak', best >= 7],
    ['streak30', 'flame', 'Unbreakable', 'Reach a 30-day streak', best >= 30],
    ['pr1', 'trophy', 'Personal Best', 'Set your first PR', prs >= 1],
    ['pr5', 'trophy', 'PR Machine', 'Set 5 PRs', prs >= 5],
    ['sets100', 'dumbbell', 'Century', 'Log 100 total sets', totalSets >= 100],
    ['sets500', 'dumbbell', 'Iron Veteran', 'Log 500 total sets', totalSets >= 500],
    ['sessions25', 'chart', 'Committed', 'Finish 25 sessions', done.length >= 25],
    ['goal', 'target', 'Goal Crusher', 'Reach your target weight', hitGoal],
  ];

  return defs.map(([id, icon, name, desc, got]) => ({ id, icon, name, desc, got }));
}
