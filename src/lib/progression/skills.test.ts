import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/lib/storage/defaults';
import type { AppState, Attempt } from '@/types';
import { SKILL_RULES } from './config';
import { skillProgress } from './skills';

const at = (qid: string, correct: boolean): Attempt => ({ qid, domain: 'secure', skill: 'iam', correct, at: '2025-01-01T00:00:00Z', source: 'practice' });
const withAttempts = (list: Attempt[], completed = true): AppState => {
  const s = createInitialState('2025-01-01');
  s.attempts = list;
  if (completed) s.modules.iam = { completedAt: '2025-01-01T00:00:00Z', bestScore: 100 };
  return s;
};

describe('skill status', () => {
  it('is not started with no activity', () => {
    expect(skillProgress(createInitialState(), 'iam').status).toBe('not-started');
  });
  it('is learning after opening the module, never proficient from that alone', () => {
    const s = createInitialState();
    s.moduleVisits.iam = '2025-01-01T00:00:00Z';
    expect(skillProgress(s, 'iam').status).toBe('learning');
    s.modules.iam = { completedAt: '2025-01-01T00:00:00Z', bestScore: 100 };
    expect(skillProgress(s, 'iam').status).toBe('learning');
  });
  it('is practiced with enough accurate attempts', () => {
    const s = withAttempts(Array.from({ length: SKILL_RULES.practicedMinAttempts }, (_, i) => at(`q${i % 4}`, true)), false);
    expect(skillProgress(s, 'iam').status).toBe('practiced');
  });
  it('requires module completion, volume, variety and accuracy for proficiency', () => {
    const many = Array.from({ length: 10 }, (_, i) => at(`q${i % 4}`, true));
    expect(skillProgress(withAttempts(many), 'iam').status).toBe('proficient');
    expect(skillProgress(withAttempts(many, false), 'iam').status).toBe('practiced');
    const oneQuestion = Array.from({ length: 10 }, () => at('q0', true));
    expect(skillProgress(withAttempts(oneQuestion), 'iam').status).not.toBe('proficient');
    const sloppy = Array.from({ length: 10 }, (_, i) => at(`q${i % 4}`, i % 2 === 0));
    expect(skillProgress(withAttempts(sloppy), 'iam').status).not.toBe('proficient');
  });
  it('measures accuracy over the recent window', () => {
    const list = [...Array.from({ length: 10 }, (_, i) => at(`q${i % 4}`, false)), ...Array.from({ length: SKILL_RULES.window }, (_, i) => at(`q${i % 4}`, true))];
    expect(skillProgress(withAttempts(list), 'iam').status).toBe('proficient');
  });
});
