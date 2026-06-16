/** Consecutive-day training streak. Pure given an injectable `now`. */

interface DatedEntry {
  d: string;
}

/**
 * Counts the run of consecutive days (ending today, or yesterday if today
 * isn't logged yet) that have at least one entry.
 */
export function computeStreak(
  done: readonly DatedEntry[] | undefined,
  now: Date = new Date(),
): number {
  const days = new Set((done ?? []).map((x) => x.d));
  const key = (d: Date) => d.toISOString().slice(0, 10);
  const cursor = new Date(now);
  if (!days.has(key(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(key(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
