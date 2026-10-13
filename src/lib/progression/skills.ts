import { SKILLS } from '@/data/skills';
import { accuracyOf } from '@/lib/scoring';
import type { AppState } from '@/types';
import { SKILL_RULES } from './config';

export type SkillStatus = 'not-started' | 'learning' | 'practiced' | 'proficient';

export interface SkillProgress {
  status: SkillStatus;
  attempts: number;
  distinct: number;
  /** Accuracy over the most recent window of attempts, or null with no data. */
  accuracy: number | null;
  moduleCompleted: boolean;
}

export const STATUS_LABEL: Record<SkillStatus, string> = {
  'not-started': 'Not started',
  learning: 'Learning',
  practiced: 'Practiced',
  proficient: 'Proficient',
};

export function skillProgress(state: AppState, skillId: string): SkillProgress {
  const attempts = state.attempts.filter((a) => a.skill === skillId);
  const recent = attempts.slice(-SKILL_RULES.window);
  const accuracy = accuracyOf(recent);
  const distinct = new Set(attempts.map((a) => a.qid)).size;
  const moduleCompleted = skillId in state.modules;
  const touched = moduleCompleted || skillId in state.moduleVisits || attempts.length > 0;

  let status: SkillStatus = touched ? 'learning' : 'not-started';
  const acc = accuracy ?? 0;
  if (attempts.length >= SKILL_RULES.practicedMinAttempts && acc >= SKILL_RULES.practicedAccuracy) status = 'practiced';
  if (
    moduleCompleted &&
    attempts.length >= SKILL_RULES.proficientMinAttempts &&
    distinct >= SKILL_RULES.proficientMinDistinct &&
    acc >= SKILL_RULES.proficientAccuracy
  ) {
    status = 'proficient';
  }
  return { status, attempts: attempts.length, distinct, accuracy, moduleCompleted };
}

export const allSkillProgress = (state: AppState): Record<string, SkillProgress> =>
  Object.fromEntries(SKILLS.map((s) => [s.id, skillProgress(state, s.id)]));
