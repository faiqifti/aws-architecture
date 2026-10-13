/** Cumulative XP needed to reach level n: 50·n·(n−1) → L2 = 100, L3 = 300, L4 = 600, L5 = 1000 … */
export const xpForLevel = (level: number): number => 50 * level * (level - 1);

export function levelFromXp(xp: number): number {
  const safe = Math.max(0, xp);
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * safe) / 50)) / 2));
  // Guard against floating-point drift at exact boundaries.
  while (xpForLevel(level + 1) <= safe) level++;
  while (level > 1 && xpForLevel(level) > safe) level--;
  return level;
}

const TITLES = ['Cloud Newcomer', 'Console Explorer', 'Junior Builder', 'Solutions Apprentice', 'Network Navigator', 'Resilience Engineer', 'Solutions Architect', 'Principal Designer'];

export const levelTitle = (level: number): string => TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 2))] ?? TITLES[0]!;

export interface LevelInfo {
  level: number;
  title: string;
  xp: number;
  levelStart: number;
  nextLevelAt: number;
  xpIntoLevel: number;
  xpNeeded: number;
  progress: number;
}

export function levelInfo(xp: number): LevelInfo {
  const level = levelFromXp(xp);
  const levelStart = xpForLevel(level);
  const nextLevelAt = xpForLevel(level + 1);
  const xpIntoLevel = Math.max(0, xp) - levelStart;
  const xpNeeded = nextLevelAt - levelStart;
  return { level, title: levelTitle(level), xp, levelStart, nextLevelAt, xpIntoLevel, xpNeeded, progress: xpNeeded ? xpIntoLevel / xpNeeded : 0 };
}
