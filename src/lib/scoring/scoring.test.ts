import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '@/data/questions';
import type { Attempt, Question } from '@/types';
import { domainAccuracy, evaluateExam, incorrectQuestionIds, isCorrect, percent, weakestDomain } from '.';
import { buildExam, domainQuotas } from './exam';
import { estimateReadiness } from './readiness';

const att = (qid: string, domain: Attempt['domain'], correct: boolean): Attempt => ({ qid, domain, skill: 's', correct, at: '2025-01-01T00:00:00Z', source: 'practice' });

describe('question bank integrity', () => {
  it('has unique ids and valid answer keys', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) {
      const ids = q.options.map((o) => o.id);
      expect(q.correct.length).toBeGreaterThan(0);
      for (const c of q.correct) expect(ids).toContain(c);
      expect(q.options.length).toBeGreaterThanOrEqual(4);
      expect(q.options.every((o) => o.why.length > 0)).toBe(true);
    }
  });
  it('covers every domain and every skill', () => {
    for (const d of ['secure', 'resilient', 'performance', 'cost']) expect(QUESTIONS.some((q) => q.domain === d)).toBe(true);
  });
});

describe('isCorrect', () => {
  const single = { correct: ['b'] };
  const multi = { correct: ['a', 'c'] };
  it('single answer', () => {
    expect(isCorrect(single, ['b'])).toBe(true);
    expect(isCorrect(single, ['a'])).toBe(false);
    expect(isCorrect(single, [])).toBe(false);
  });
  it('multi answer requires an exact match', () => {
    expect(isCorrect(multi, ['c', 'a'])).toBe(true);
    expect(isCorrect(multi, ['a'])).toBe(false);
    expect(isCorrect(multi, ['a', 'b', 'c'])).toBe(false);
    expect(isCorrect(multi, ['a', 'b'])).toBe(false);
  });
});

describe('aggregates', () => {
  it('percent handles zero', () => {
    expect(percent(0, 0)).toBe(0);
    expect(percent(1, 3)).toBe(33);
  });
  it('incorrectQuestionIds uses the latest attempt', () => {
    const a = [att('q1', 'secure', false), att('q2', 'secure', false), att('q1', 'secure', true)];
    expect(incorrectQuestionIds(a)).toEqual(['q2']);
  });
  it('weakestDomain needs enough attempts', () => {
    const few = [att('a', 'cost', false)];
    expect(weakestDomain(few)).toBeNull();
    const many = [
      ...Array.from({ length: 6 }, (_, i) => att(`s${i}`, 'secure', true)),
      ...Array.from({ length: 6 }, (_, i) => att(`c${i}`, 'cost', i < 2)),
    ];
    expect(weakestDomain(many)).toBe('cost');
    expect(domainAccuracy(many).secure.accuracy).toBe(100);
  });
  it('readiness is null without data and discounts thin coverage', () => {
    expect(estimateReadiness([]).score).toBeNull();
    const only = Array.from({ length: 12 }, (_, i) => att(`s${i}`, 'secure', true));
    expect(estimateReadiness(only).score).toBeLessThan(40);
  });
});

describe('evaluateExam', () => {
  const qs: Question[] = QUESTIONS.slice(0, 4);
  it('scores answers, treats unanswered as wrong and lists revision skills', () => {
    const answers: Record<string, string[]> = { [qs[0]!.id]: qs[0]!.correct, [qs[1]!.id]: ['zzz'] };
    const r = evaluateExam(qs, answers);
    expect(r.total).toBe(4);
    expect(r.correct).toBe(1);
    expect(r.unanswered).toBe(2);
    expect(r.percent).toBe(25);
    expect(r.missedIds).toEqual([qs[1]!.id, qs[2]!.id, qs[3]!.id]);
    expect(r.revisionSkills.length).toBeGreaterThan(0);
    expect(Object.values(r.byDomain).reduce((s, d) => s + d.total, 0)).toBe(4);
  });
  it('perfect score has no revision topics', () => {
    const answers = Object.fromEntries(qs.map((q) => [q.id, q.correct]));
    const r = evaluateExam(qs, answers);
    expect(r.percent).toBe(100);
    expect(r.revisionSkills).toEqual([]);
  });
});

describe('exam building', () => {
  it('quotas sum exactly to the requested count', () => {
    for (const n of [10, 20, 33, 65]) expect(Object.values(domainQuotas(n)).reduce((a, b) => a + b, 0)).toBe(n);
  });
  it('builds unique questions up to the bank size', () => {
    const exam = buildExam(QUESTIONS, 65);
    expect(exam.length).toBe(Math.min(65, QUESTIONS.length));
    expect(new Set(exam.map((q) => q.id)).size).toBe(exam.length);
    expect(buildExam(QUESTIONS, 9999).length).toBe(QUESTIONS.length);
  });
});
