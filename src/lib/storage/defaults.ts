import { DEFAULT_SETTINGS } from '@/lib/progression/config';
import { emptyStreak, toDateKey } from '@/lib/streaks';
import type { AppState } from '@/types';

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'cloudquest:v1';
export const ACTIVE_EXAM_KEY = 'cloudquest:active-exam';

export function createInitialState(today: string = toDateKey()): AppState {
  return {
    version: SCHEMA_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    xp: 0,
    rewards: {},
    modules: {},
    moduleVisits: {},
    attempts: [],
    flagged: [],
    quizHistory: [],
    examResults: [],
    challenges: {},
    streak: emptyStreak(),
    daily: { date: today, questions: 0, modules: 0, challenges: 0, repeatXp: 0 },
    achievements: {},
  };
}
