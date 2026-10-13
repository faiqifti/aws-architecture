import type { StreakState } from '@/types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as YYYY-MM-DD (not UTC), so "today" matches the learner's wall clock. */
export function toDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whole calendar days from a to b. Uses UTC math on the date parts, so DST never skews it. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number) as [number, number, number];
  const [by, bm, bd] = b.split('-').map(Number) as [number, number, number];
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

export const emptyStreak = (): StreakState => ({ current: 0, longest: 0, lastDate: null });

/** Record qualifying activity on `today`. Same day is a no-op; consecutive day extends; a gap restarts at 1. */
export function recordActivity(streak: StreakState, today: string): StreakState {
  if (streak.lastDate === null) return { current: 1, longest: Math.max(1, streak.longest), lastDate: today };
  const gap = daysBetween(streak.lastDate, today);
  // gap <= 0 covers same day and clock/timezone changes that put "today" before the stored date.
  if (gap <= 0) return streak;
  const current = gap === 1 ? streak.current + 1 : 1;
  return { current, longest: Math.max(streak.longest, current), lastDate: today };
}

/** The streak to display: it is still alive if the last activity was today or yesterday. */
export function displayStreak(streak: StreakState, today: string): number {
  if (streak.lastDate === null) return 0;
  return daysBetween(streak.lastDate, today) <= 1 ? streak.current : 0;
}
