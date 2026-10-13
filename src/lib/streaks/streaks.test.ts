import { describe, expect, it } from 'vitest';
import { daysBetween, displayStreak, emptyStreak, recordActivity, toDateKey } from '.';

describe('streaks', () => {
  it('formats local calendar dates, not UTC', () => {
    expect(toDateKey(new Date(2025, 0, 5, 23, 59))).toBe('2025-01-05');
    expect(toDateKey(new Date(2025, 11, 31, 0, 1))).toBe('2025-12-31');
  });
  it('counts calendar days across month, year and DST changes', () => {
    expect(daysBetween('2025-01-31', '2025-02-01')).toBe(1);
    expect(daysBetween('2024-12-31', '2025-01-01')).toBe(1);
    expect(daysBetween('2025-03-08', '2025-03-10')).toBe(2);
    expect(daysBetween('2025-10-31', '2025-11-02')).toBe(2);
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
  });
  it('starts, extends, holds and restarts', () => {
    let s = recordActivity(emptyStreak(), '2025-03-01');
    expect(s).toEqual({ current: 1, longest: 1, lastDate: '2025-03-01' });
    s = recordActivity(s, '2025-03-01');
    expect(s.current).toBe(1);
    s = recordActivity(s, '2025-03-02');
    s = recordActivity(s, '2025-03-03');
    expect(s.current).toBe(3);
    s = recordActivity(s, '2025-03-06');
    expect(s).toEqual({ current: 1, longest: 3, lastDate: '2025-03-06' });
  });
  it('never decreases when the clock moves backwards (timezone travel)', () => {
    const s = recordActivity({ current: 4, longest: 4, lastDate: '2025-03-10' }, '2025-03-09');
    expect(s.current).toBe(4);
    expect(s.lastDate).toBe('2025-03-10');
  });
  it('shows a live streak until a full day is missed', () => {
    const s = { current: 5, longest: 5, lastDate: '2025-03-10' };
    expect(displayStreak(s, '2025-03-10')).toBe(5);
    expect(displayStreak(s, '2025-03-11')).toBe(5);
    expect(displayStreak(s, '2025-03-12')).toBe(0);
    expect(displayStreak(emptyStreak(), '2025-03-12')).toBe(0);
  });
});
