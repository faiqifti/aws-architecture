import { describe, expect, it } from 'vitest';
import { CHALLENGES } from '@/data/challenges';
import { QUESTIONS } from '@/data/questions';
import { createInitialState } from '@/lib/storage/defaults';
import type { AppState, ExamResult } from '@/types';
import { RULES, XP } from './config';
import { completeChallenge, completeExam, completeModule, finishQuiz, recordAnswer } from './engine';
import { getMissions } from './missions';

const D1 = new Date(2025, 5, 10, 12);
const D2 = new Date(2025, 5, 11, 12);
const q = QUESTIONS[0]!;
const wrong = q.options.find((o) => !q.correct.includes(o.id))!.id;

const fresh = (): AppState => createInitialState('2025-06-10');
const xpEvents = (events: { type: string }[]) => events.filter((e) => e.type === 'xp').length;

describe('answers and XP', () => {
  it('awards XP for the first correct answer only', () => {
    let o = recordAnswer(fresh(), q, q.correct, 'practice', D1);
    expect(o.result.correct).toBe(true);
    expect(o.state.xp).toBe(XP.correctFirstTime);
    o = recordAnswer(o.state, q, q.correct, 'practice', D1);
    expect(o.state.xp).toBe(XP.correctFirstTime + XP.correctRepeat);
  });
  it('gives no XP for wrong answers but records the attempt', () => {
    const o = recordAnswer(fresh(), q, [wrong], 'practice', D1);
    expect(o.result.correct).toBe(false);
    expect(o.state.xp).toBe(0);
    expect(o.state.attempts).toHaveLength(1);
  });
  it('wrong first, correct later still earns first-time XP once', () => {
    let o = recordAnswer(fresh(), q, [wrong], 'practice', D1);
    o = recordAnswer(o.state, q, q.correct, 'retry', D1);
    expect(o.state.xp).toBe(XP.correctFirstTime);
  });
  it('caps repeat-answer XP per day and resets the next day', () => {
    let s = recordAnswer(fresh(), q, q.correct, 'practice', D1).state;
    for (let i = 0; i < 40; i++) s = recordAnswer(s, q, q.correct, 'practice', D1).state;
    // 10 first-time + 20 capped repeats + the 30 XP daily "answer N questions" mission.
    const base = XP.correctFirstTime + XP.repeatDailyCap + XP.mission;
    expect(s.xp).toBe(base);
    s = recordAnswer(s, q, q.correct, 'practice', D2).state;
    expect(s.xp).toBe(base + XP.correctRepeat);
  });
  it('does not mutate the input state', () => {
    const s = fresh();
    recordAnswer(s, q, q.correct, 'practice', D1);
    expect(s.xp).toBe(0);
    expect(s.attempts).toHaveLength(0);
  });
});

describe('modules', () => {
  it('requires the pass ratio and pays 50 XP once', () => {
    let o = completeModule(fresh(), 'iam', 1, 4, D1);
    expect(o.result.passed).toBe(false);
    expect(o.state.modules.iam).toBeUndefined();
    expect(o.state.xp).toBe(0);
    o = completeModule(o.state, 'iam', 3, 4, D1);
    expect(o.result.passed).toBe(true);
    expect(o.state.xp).toBeGreaterThanOrEqual(XP.module);
    const afterFirst = o.state.xp;
    o = completeModule(o.state, 'iam', 4, 4, D1);
    expect(o.state.xp).toBe(afterFirst);
    expect(o.state.modules.iam?.bestScore).toBe(100);
  });
  it('unlocks First Steps from persisted data', () => {
    const o = completeModule(fresh(), 'iam', 4, 4, D1);
    expect(o.state.achievements['first-steps']).toBeDefined();
    expect(o.events.some((e) => e.type === 'achievement')).toBe(true);
  });
});

describe('daily missions', () => {
  it('complete only through real activity and pay once per day', () => {
    let s = fresh();
    s.settings.dailyTarget = 3;
    expect(getMissions(s).every((m) => !m.done)).toBe(true);
    for (let i = 0; i < 3; i++) s = recordAnswer(s, QUESTIONS[i]!, QUESTIONS[i]!.correct, 'practice', D1).state;
    const m = getMissions(s).find((x) => x.id === 'questions')!;
    expect(m.done).toBe(true);
    expect(s.xp).toBe(3 * XP.correctFirstTime + XP.mission);
    const before = s.xp;
    s = recordAnswer(s, QUESTIONS[3]!, QUESTIONS[3]!.correct, 'practice', D1).state;
    expect(s.xp).toBe(before + XP.correctFirstTime);
  });
  it('reset on a new day', () => {
    let s = fresh();
    s.settings.dailyTarget = 1;
    s = recordAnswer(s, q, q.correct, 'practice', D1).state;
    expect(getMissions(s).find((m) => m.id === 'questions')!.done).toBe(true);
    s = recordAnswer(s, QUESTIONS[1]!, [wrong], 'practice', D2).state;
    expect(s.daily.date).toBe('2025-06-11');
    expect(s.daily.questions).toBe(1);
  });
});

describe('challenges', () => {
  const ch = CHALLENGES[0]!;
  it('pays on first pass only', () => {
    let o = completeChallenge(fresh(), ch.id, 40, D1);
    expect(o.result.passed).toBe(false);
    expect(o.state.challenges[ch.id]?.completedAt).toBeNull();
    expect(o.state.daily.challenges).toBe(1);
    o = completeChallenge(o.state, ch.id, RULES.challengePassScore + 10, D1);
    expect(o.state.challenges[ch.id]?.completedAt).not.toBeNull();
    const xp = o.state.xp;
    expect(xp).toBeGreaterThanOrEqual(XP.challenge);
    o = completeChallenge(o.state, ch.id, 100, D1);
    expect(o.state.xp).toBe(xp);
    expect(o.state.challenges[ch.id]?.bestScore).toBe(100);
    expect(o.state.challenges[ch.id]?.attempts).toBe(3);
  });
  it('unlocks Architecture Designer after five completions', () => {
    let s = fresh();
    for (const c of CHALLENGES.slice(0, 5)) s = completeChallenge(s, c.id, 90, D1).state;
    expect(s.achievements['architecture-designer']).toBeDefined();
  });
});

describe('mock exams', () => {
  const result = (percent: number, total = 20): ExamResult => ({
    id: `e${percent}-${Math.random()}`, at: D1.toISOString(), total, correct: Math.round((total * percent) / 100), percent, timeLimitMin: 30, timeUsedSec: 100,
    timedOut: false, byDomain: createInitialState().attempts as never, missedIds: [], revisionSkills: [],
  });
  it('first exam pays 100, repeats pay only on a new best', () => {
    let o = completeExam(fresh(), result(60), [], D1);
    expect(o.state.xp).toBe(XP.examFirst);
    o = completeExam(o.state, result(50), [], D1);
    expect(o.state.xp).toBe(XP.examFirst);
    o = completeExam(o.state, result(70), [], D1);
    expect(o.state.xp).toBe(XP.examFirst + XP.examImprovement);
    o = completeExam(o.state, result(70), [], D1);
    expect(o.state.xp).toBe(XP.examFirst + XP.examImprovement);
  });
  it('short exams pay nothing and do not unlock Exam Ready', () => {
    const o = completeExam(fresh(), result(100, 10), [], D1);
    expect(o.state.xp).toBe(0);
    expect(o.state.achievements['exam-ready']).toBeUndefined();
  });
  it('Exam Ready needs the configured threshold on a long-enough exam', () => {
    let o = completeExam(fresh(), result(RULES.examReadyThreshold - 5), [], D1);
    expect(o.state.achievements['exam-ready']).toBeUndefined();
    o = completeExam(o.state, result(RULES.examReadyThreshold), [], D1);
    expect(o.state.achievements['exam-ready']).toBeDefined();
  });
});

describe('streak, quiz history and achievements', () => {
  it('extends the streak across consecutive days of activity', () => {
    let s = recordAnswer(fresh(), q, q.correct, 'practice', D1).state;
    s = recordAnswer(s, q, q.correct, 'practice', D2).state;
    expect(s.streak.current).toBe(2);
  });
  it('Consistent Learner follows the longest streak', () => {
    let s = fresh();
    for (let d = 0; d < 7; d++) s = recordAnswer(s, q, q.correct, 'practice', new Date(2025, 5, 1 + d, 9)).state;
    expect(s.streak.current).toBe(7);
    expect(s.achievements['consistent-learner']).toBeDefined();
  });
  it('Curious Architect unlocks at 25 answers', () => {
    let s = fresh();
    for (let i = 0; i < 24; i++) s = recordAnswer(s, QUESTIONS[i % QUESTIONS.length]!, [wrong], 'practice', D1).state;
    expect(s.achievements['curious-architect']).toBeUndefined();
    s = recordAnswer(s, q, q.correct, 'practice', D1).state;
    expect(s.achievements['curious-architect']).toBeDefined();
  });
  it('Security Minded needs both volume and accuracy', () => {
    const sec = QUESTIONS.filter((x) => x.domain === 'secure');
    let s = fresh();
    for (const x of sec.slice(0, 9)) s = recordAnswer(s, x, x.correct, 'practice', D1).state;
    expect(s.achievements['security-minded']).toBeUndefined();
    s = recordAnswer(s, sec[9]!, sec[9]!.correct, 'practice', D1).state;
    expect(s.achievements['security-minded']).toBeDefined();
    // Accuracy below the bar prevents it.
    let t = fresh();
    for (const x of sec.slice(0, 10)) t = recordAnswer(t, x, [x.options.find((o) => !x.correct.includes(o.id))!.id], 'practice', D1).state;
    expect(t.achievements['security-minded']).toBeUndefined();
  });
  it('records quiz history', () => {
    const o = finishQuiz(fresh(), { kind: 'practice', label: 'Test', items: [{ domain: 'secure', correct: true }, { domain: 'cost', correct: false }] }, D1);
    expect(o.state.quizHistory).toHaveLength(1);
    expect(o.state.quizHistory[0]!.correct).toBe(1);
    expect(xpEvents(o.events)).toBe(0);
  });
});
