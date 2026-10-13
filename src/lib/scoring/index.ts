import { DOMAIN_IDS } from '@/data/domains';
import type { Attempt, DomainBreakdown, DomainId, Question } from '@/types';

export const emptyBreakdown = (): DomainBreakdown =>
  Object.fromEntries(DOMAIN_IDS.map((d) => [d, { correct: 0, total: 0 }])) as DomainBreakdown;

/** A multiple-answer question is correct only when the selection matches the answer key exactly. */
export function isCorrect(question: Pick<Question, 'correct'>, selected: string[]): boolean {
  const picked = new Set(selected);
  return picked.size === question.correct.length && question.correct.every((id) => picked.has(id));
}

export const percent = (correct: number, total: number): number => (total === 0 ? 0 : Math.round((correct / total) * 100));

export function breakdownOf(items: { domain: DomainId; correct: boolean }[]): DomainBreakdown {
  const out = emptyBreakdown();
  for (const it of items) {
    out[it.domain].total++;
    if (it.correct) out[it.domain].correct++;
  }
  return out;
}

export function accuracyOf(attempts: Pick<Attempt, 'correct'>[]): number | null {
  if (attempts.length === 0) return null;
  return percent(attempts.filter((a) => a.correct).length, attempts.length);
}

/** Overall accuracy per domain from the full attempt log. */
export function domainAccuracy(attempts: Attempt[]): Record<DomainId, { accuracy: number | null; attempts: number }> {
  const b = breakdownOf(attempts);
  return Object.fromEntries(
    DOMAIN_IDS.map((d) => [d, { accuracy: b[d].total ? percent(b[d].correct, b[d].total) : null, attempts: b[d].total }]),
  ) as Record<DomainId, { accuracy: number | null; attempts: number }>;
}

/** Latest attempt per question id. */
export function latestAttempts(attempts: Attempt[]): Map<string, Attempt> {
  const m = new Map<string, Attempt>();
  for (const a of attempts) m.set(a.qid, a);
  return m;
}

/** Question ids whose most recent attempt was wrong. */
export function incorrectQuestionIds(attempts: Attempt[]): string[] {
  return [...latestAttempts(attempts).values()].filter((a) => !a.correct).map((a) => a.qid);
}

/** The weakest domain: lowest accuracy among domains with enough attempts to be meaningful. */
export function weakestDomain(attempts: Attempt[], minAttempts = 5): DomainId | null {
  const acc = domainAccuracy(attempts);
  let weakest: DomainId | null = null;
  for (const d of DOMAIN_IDS) {
    const { accuracy, attempts: n } = acc[d];
    if (accuracy === null || n < minAttempts) continue;
    if (weakest === null || accuracy < (acc[weakest].accuracy ?? 101)) weakest = d;
  }
  return weakest;
}

export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export interface ExamEvaluation {
  total: number;
  correct: number;
  unanswered: number;
  percent: number;
  byDomain: DomainBreakdown;
  missedIds: string[];
  /** Skills (modules) with weak performance in this exam, weakest first. */
  revisionSkills: string[];
}

/** Evaluate an exam. Unanswered questions count as incorrect. */
export function evaluateExam(questions: Question[], answers: Record<string, string[]>): ExamEvaluation {
  const results = questions.map((q) => {
    const sel = answers[q.id] ?? [];
    return { q, answered: sel.length > 0, correct: isCorrect(q, sel) };
  });
  const correct = results.filter((r) => r.correct).length;
  const bySkill = new Map<string, { correct: number; total: number }>();
  for (const r of results) {
    const t = bySkill.get(r.q.skill) ?? { correct: 0, total: 0 };
    t.total++;
    if (r.correct) t.correct++;
    bySkill.set(r.q.skill, t);
  }
  const revisionSkills = [...bySkill.entries()]
    .filter(([, t]) => t.correct / t.total < 0.7)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .map(([skill]) => skill);
  return {
    total: questions.length,
    correct,
    unanswered: results.filter((r) => !r.answered).length,
    percent: percent(correct, questions.length),
    byDomain: breakdownOf(results.map((r) => ({ domain: r.q.domain, correct: r.correct }))),
    missedIds: results.filter((r) => !r.correct).map((r) => r.q.id),
    revisionSkills,
  };
}

/** Copy of a question with its options in random order (ids are unchanged, so the answer key still applies). */
export function prepareQuestion(question: Question, rand: () => number = Math.random): Question {
  return { ...question, options: shuffle(question.options, rand) };
}

export const prepareQuestions = (questions: Question[], rand: () => number = Math.random): Question[] =>
  shuffle(questions, rand).map((x) => prepareQuestion(x, rand));
