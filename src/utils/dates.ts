/**
 * All dates in English Saathi are LOCAL calendar dates of the device (e.g. "2026-10-14").
 * A "day" therefore changes at local midnight of the phone's time zone. If the learner travels
 * across time zones, the day boundary follows the phone.
 */
const pad = (n: number) => String(n).padStart(2, '0');

export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseKey(to).getTime() - parseKey(from).getTime()) / 86_400_000);
}

/** The last n local dates ending at `today` (inclusive), oldest first. */
export function lastNDays(today: string, n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(today, -i));
  return out;
}

export interface StreakInfo {
  current: number;
  longest: number;
  activeToday: boolean;
  /** Streak is alive but today has no activity yet. */
  atRisk: boolean;
  /** Days since the last activity day (null if never). */
  daysSinceLast: number | null;
}

export function computeStreak(activeDays: string[], today: string): StreakInfo {
  const set = new Set(activeDays);
  const unique = [...set].sort();
  const activeToday = set.has(today);
  let cursor = activeToday ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of unique) {
    run = prev && addDays(prev, 1) === k ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = k;
  }
  const last = unique.length ? unique[unique.length - 1] : null;
  return {
    current,
    longest,
    activeToday,
    atRisk: !activeToday && current > 0,
    daysSinceLast: last ? daysBetween(last, today) : null,
  };
}
