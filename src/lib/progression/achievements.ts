import { SKILLS } from '@/data/skills';
import { accuracyOf } from '@/lib/scoring';
import type { AppState } from '@/types';
import { RULES } from './config';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  /** Progress toward unlocking as current/target, evaluated from persisted state. */
  progress: (s: AppState) => { current: number; target: number };
}

const clampP = (current: number, target: number) => ({ current: Math.min(current, target), target });

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first learning module.',
    progress: (s) => clampP(Object.keys(s.modules).length, 1),
  },
  {
    id: 'curious-architect',
    name: 'Curious Architect',
    description: 'Answer 25 questions.',
    progress: (s) => clampP(s.attempts.length, 25),
  },
  {
    id: 'security-minded',
    name: 'Security Minded',
    description: `Reach ${RULES.securityAccuracy}% accuracy on at least ${RULES.securityMinQuestions} Secure Architectures answers.`,
    progress: (s) => {
      const sec = s.attempts.filter((a) => a.domain === 'secure');
      const acc = accuracyOf(sec) ?? 0;
      // Both conditions must hold; report the less-complete one as progress.
      if (sec.length < RULES.securityMinQuestions) return clampP(sec.length, RULES.securityMinQuestions);
      return acc >= RULES.securityAccuracy ? { current: 1, target: 1 } : { current: 0, target: 1 };
    },
  },
  {
    id: 'consistent-learner',
    name: 'Consistent Learner',
    description: 'Maintain a seven-day learning streak.',
    progress: (s) => clampP(s.streak.longest, 7),
  },
  {
    id: 'architecture-designer',
    name: 'Architecture Designer',
    description: 'Complete five architecture challenges.',
    progress: (s) => clampP(Object.values(s.challenges).filter((c) => c.completedAt).length, 5),
  },
  {
    id: 'exam-ready',
    name: 'Exam Ready',
    description: `Score ${RULES.examReadyThreshold}% or more on a mock exam of ${RULES.minExamQuestions}+ questions.`,
    progress: (s) => {
      const best = Math.max(0, ...s.examResults.filter((e) => e.total >= RULES.minExamQuestions).map((e) => e.percent));
      return clampP(best, RULES.examReadyThreshold);
    },
  },
  {
    id: 'well-rounded',
    name: 'Well Rounded',
    description: 'Reach Practiced or better in every skill area.',
    progress: (s) => {
      // Lazy import avoided: compute inline to keep this module independent of skills.ts.
      const total = SKILLS.length;
      const done = SKILLS.filter((k) => {
        const att = s.attempts.filter((a) => a.skill === k.id);
        return att.length >= 5 && (accuracyOf(att.slice(-12)) ?? 0) >= 60;
      }).length;
      return clampP(done, total);
    },
  },
];

export const achievementById = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);

export const isUnlockable = (def: AchievementDef, s: AppState): boolean => {
  const p = def.progress(s);
  return p.current >= p.target;
};
