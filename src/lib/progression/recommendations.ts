import { CHALLENGES } from '@/data/challenges';
import { domainById } from '@/data/domains';
import { MODULES } from '@/data/modules';
import { skillById } from '@/data/skills';
import { incorrectQuestionIds, weakestDomain } from '@/lib/scoring';
import type { AppState } from '@/types';
import { RULES } from './config';

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  to: string;
}

/** Suggest what to do next, from the learner's actual state. At most four items. */
export function recommend(state: AppState): Recommendation[] {
  const out: Recommendation[] = [];
  const done = (id: string) => id in state.modules;
  const unmet = (id: string) => (skillById(id)?.prerequisites ?? []).filter((p) => !done(p)).length;
  const fits = state.settings.studyMinutes;

  const weak = weakestDomain(state.attempts);
  if (weak) {
    const m = MODULES.find((x) => x.domain === weak && !done(x.id)) ?? MODULES.find((x) => x.domain === weak);
    if (m) out.push({ id: 'weak', title: `Strengthen: ${m.title}`, reason: `${domainById(weak).short} is your weakest domain so far.`, to: `/learn/${m.id}` });
  }

  const wrong = incorrectQuestionIds(state.attempts).length;
  if (wrong > 0) out.push({ id: 'retry', title: `Retry ${wrong} incorrect question${wrong === 1 ? '' : 's'}`, reason: 'Turning mistakes into correct answers is the fastest way to improve.', to: '/practice?mode=retry' });

  const candidates = MODULES.filter((m) => !done(m.id)).sort((a, b) => unmet(a.id) - unmet(b.id) || Math.abs(a.minutes - fits) - Math.abs(b.minutes - fits));
  const next = candidates.find((m) => !out.some((o) => o.to === `/learn/${m.id}`));
  if (next) out.push({ id: 'module', title: `Learn: ${next.title}`, reason: `About ${next.minutes} min. Fits your ${fits}-minute study goal.`, to: `/learn/${next.id}` });

  const ch = CHALLENGES.find((c) => !state.challenges[c.id]?.completedAt);
  if (ch) out.push({ id: 'challenge', title: `Design: ${ch.title}`, reason: 'Apply services to a realistic scenario.', to: `/challenges/${ch.id}` });

  const hasExam = state.examResults.some((e) => e.total >= RULES.minExamQuestions);
  if (!hasExam && Object.keys(state.modules).length >= 5) out.push({ id: 'exam', title: 'Try a mock exam', reason: 'You have covered several modules; test under time pressure.', to: '/exam' });

  return out.slice(0, 4);
}
