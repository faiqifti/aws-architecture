import { breakdownOf, isCorrect } from '@/lib/scoring';
import { displayStreak, recordActivity, toDateKey } from '@/lib/streaks';
import type { AppState, Attempt, AttemptSource, DomainId, ExamResult, GameEvent, Question } from '@/types';
import { ACHIEVEMENTS, isUnlockable } from './achievements';
import { RULES, XP } from './config';
import { levelFromXp } from './levels';
import { getMissions, missionKey } from './missions';

/**
 * All gamification rules live here as pure functions: (state, input) -> { state, events }.
 * The UI never mutates progress directly, which keeps XP, streaks and rewards testable.
 */
export interface Outcome<T = undefined> {
  state: AppState;
  events: GameEvent[];
  result: T;
}

interface Draft {
  s: AppState;
  events: GameEvent[];
  startXp: number;
  now: Date;
  today: string;
}

/** Reset the per-day counters when the local calendar date has changed. */
export function rollDaily(state: AppState, today: string): AppState {
  if (state.daily.date === today) return state;
  return { ...state, daily: { date: today, questions: 0, modules: 0, challenges: 0, repeatXp: 0 } };
}

function begin(state: AppState, now: Date): Draft {
  const today = toDateKey(now);
  const s = structuredClone(rollDaily(state, today));
  return { s, events: [], startXp: s.xp, now, today };
}

/** Pay out XP once per reward key. Returns the amount actually granted. */
function award(d: Draft, key: string | null, amount: number, label: string): number {
  if (amount <= 0) return 0;
  if (key !== null) {
    if (key in d.s.rewards) return 0;
    d.s.rewards[key] = d.now.toISOString();
  }
  d.s.xp += amount;
  d.events.push({ type: 'xp', amount, label });
  return amount;
}

function touchStreak(d: Draft): void {
  d.s.streak = recordActivity(d.s.streak, d.today);
}

function finish<T>(d: Draft, result: T): Outcome<T> {
  // Daily missions: completed purely from recorded actions.
  for (const m of getMissions(d.s)) {
    if (!m.done && m.progress >= m.target) {
      if (award(d, missionKey(d.s.daily.date, m.id), m.reward, `Mission: ${m.title}`) > 0) d.events.push({ type: 'mission', id: m.id });
    }
  }
  // Achievements: evaluated against the persisted data.
  for (const a of ACHIEVEMENTS) {
    if (!(a.id in d.s.achievements) && isUnlockable(a, d.s)) {
      d.s.achievements[a.id] = d.now.toISOString();
      d.events.push({ type: 'achievement', id: a.id });
    }
  }
  const before = levelFromXp(d.startXp);
  const after = levelFromXp(d.s.xp);
  if (after > before) d.events.push({ type: 'level', level: after });
  return { state: d.s, events: d.events, result };
}

export function recordAnswer(
  state: AppState,
  question: Question,
  selected: string[],
  source: Exclude<AttemptSource, 'exam'>,
  now: Date = new Date(),
): Outcome<{ correct: boolean }> {
  const d = begin(state, now);
  const correct = isCorrect(question, selected);
  const attempt: Attempt = { qid: question.id, domain: question.domain, skill: question.skill, correct, at: now.toISOString(), source };
  d.s.attempts.push(attempt);
  if (d.s.attempts.length > 10000) d.s.attempts.splice(0, d.s.attempts.length - 10000);
  d.s.daily.questions++;
  if (correct) {
    const paid = award(d, `q:${question.id}`, XP.correctFirstTime, 'Correct answer');
    if (paid === 0) {
      // Repeats earn a small amount, capped per day, so replaying cannot farm XP.
      const room = XP.repeatDailyCap - d.s.daily.repeatXp;
      const amt = Math.max(0, Math.min(XP.correctRepeat, room));
      if (award(d, null, amt, 'Correct answer (review)') > 0) d.s.daily.repeatXp += amt;
    }
  }
  touchStreak(d);
  return finish(d, { correct });
}

export function finishQuiz(
  state: AppState,
  quiz: { kind: 'practice' | 'retry'; label: string; items: { domain: DomainId; correct: boolean }[] },
  now: Date = new Date(),
): Outcome {
  const d = begin(state, now);
  d.s.quizHistory.push({
    id: `quiz-${now.getTime()}`,
    kind: quiz.kind,
    label: quiz.label,
    at: now.toISOString(),
    total: quiz.items.length,
    correct: quiz.items.filter((i) => i.correct).length,
    byDomain: breakdownOf(quiz.items),
  });
  if (d.s.quizHistory.length > 200) d.s.quizHistory.shift();
  return finish(d, undefined);
}

export function visitModule(state: AppState, moduleId: string, now: Date = new Date()): AppState {
  return { ...state, moduleVisits: { ...state.moduleVisits, [moduleId]: now.toISOString() } };
}

export function completeModule(
  state: AppState,
  moduleId: string,
  correct: number,
  total: number,
  now: Date = new Date(),
): Outcome<{ passed: boolean }> {
  const d = begin(state, now);
  const ratio = total === 0 ? 0 : correct / total;
  const passed = ratio >= RULES.modulePassRatio;
  const score = Math.round(ratio * 100);
  if (passed) {
    const prev = d.s.modules[moduleId];
    if (!prev) {
      d.s.daily.modules++;
      award(d, `module:${moduleId}`, XP.module, 'Module completed');
    }
    d.s.modules[moduleId] = { completedAt: prev?.completedAt ?? now.toISOString(), bestScore: Math.max(prev?.bestScore ?? 0, score) };
    touchStreak(d);
  }
  d.s.moduleVisits[moduleId] = now.toISOString();
  return finish(d, { passed });
}

export function completeChallenge(state: AppState, challengeId: string, score: number, now: Date = new Date()): Outcome<{ passed: boolean }> {
  const d = begin(state, now);
  const passed = score >= RULES.challengePassScore;
  const prev = d.s.challenges[challengeId];
  d.s.challenges[challengeId] = {
    bestScore: Math.max(prev?.bestScore ?? 0, score),
    attempts: (prev?.attempts ?? 0) + 1,
    completedAt: prev?.completedAt ?? (passed ? now.toISOString() : null),
    lastAt: now.toISOString(),
  };
  d.s.daily.challenges++;
  if (passed) award(d, `challenge:${challengeId}`, XP.challenge, 'Architecture challenge completed');
  touchStreak(d);
  return finish(d, { passed });
}

export function completeExam(
  state: AppState,
  result: ExamResult,
  answered: { question: Question; correct: boolean }[],
  now: Date = new Date(),
): Outcome {
  const d = begin(state, now);
  const prior = d.s.examResults.filter((e) => e.total >= RULES.minExamQuestions);
  const prevBest = prior.length ? Math.max(...prior.map((e) => e.percent)) : null;
  d.s.examResults.push(result);
  if (d.s.examResults.length > 100) d.s.examResults.shift();
  for (const a of answered) {
    d.s.attempts.push({ qid: a.question.id, domain: a.question.domain, skill: a.question.skill, correct: a.correct, at: now.toISOString(), source: 'exam' });
  }
  if (d.s.attempts.length > 10000) d.s.attempts.splice(0, d.s.attempts.length - 10000);
  d.s.daily.questions += answered.length;
  if (result.total >= RULES.minExamQuestions) {
    if (prevBest === null) award(d, 'exam:first', XP.examFirst, 'Mock exam completed');
    else if (result.percent > prevBest) award(d, null, XP.examImprovement, 'New best mock exam score');
  }
  touchStreak(d);
  return finish(d, undefined);
}

export function toggleFlag(state: AppState, qid: string): AppState {
  const flagged = state.flagged.includes(qid) ? state.flagged.filter((x) => x !== qid) : [...state.flagged, qid];
  return { ...state, flagged };
}

/** Streak shown in the UI (0 if the last activity was before yesterday). */
export const liveStreak = (state: AppState, today: string = toDateKey()): number => displayStreak(state.streak, today);
