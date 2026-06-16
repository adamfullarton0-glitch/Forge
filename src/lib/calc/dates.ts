/**
 * Date helpers. Each accepts an injectable `now` (defaulting to the real
 * clock) so date-dependent logic stays deterministic and testable.
 */

/** Short day labels, Monday-first to match the schedule grid. */
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const isoKey = (d: Date): string => d.toISOString().slice(0, 10);

/** Today as `YYYY-MM-DD`. */
export const todayKey = (now: Date = new Date()): string => isoKey(now);

/** Index of the day, Monday = 0 … Sunday = 6. */
export const dayIdx = (now: Date = new Date()): number => (now.getDay() + 6) % 7;

/** The Monday of the current week as `YYYY-MM-DD`. */
export function weekStartKey(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return isoKey(d);
}

/** The date `n` days before `now` as `YYYY-MM-DD`. */
export function daysAgoKey(n: number, now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return isoKey(d);
}
