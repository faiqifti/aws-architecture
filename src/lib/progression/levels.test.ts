import { describe, expect, it } from 'vitest';
import { levelFromXp, levelInfo, xpForLevel } from './levels';

describe('levels', () => {
  it('uses cumulative thresholds', () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000]);
  });
  it('maps XP to level exactly at boundaries', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(299)).toBe(2);
    expect(levelFromXp(300)).toBe(3);
    expect(levelFromXp(999)).toBe(4);
    expect(levelFromXp(1000)).toBe(5);
  });
  it('is consistent with xpForLevel for many values', () => {
    for (let xp = 0; xp < 20000; xp += 7) {
      const l = levelFromXp(xp);
      expect(xpForLevel(l)).toBeLessThanOrEqual(xp);
      expect(xpForLevel(l + 1)).toBeGreaterThan(xp);
    }
  });
  it('reports progress within the level', () => {
    const i = levelInfo(150);
    expect(i.level).toBe(2);
    expect(i.xpIntoLevel).toBe(50);
    expect(i.xpNeeded).toBe(200);
    expect(i.progress).toBeCloseTo(0.25);
  });
  it('ignores negative XP', () => {
    expect(levelFromXp(-50)).toBe(1);
  });
});
