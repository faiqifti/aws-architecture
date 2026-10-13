import type { Question } from '@/types';
import { costQuestions } from './cost';
import { performanceQuestions } from './performance';
import { resilientQuestions } from './resilient';
import { secureQuestions } from './secure';

export const QUESTIONS: Question[] = [...secureQuestions, ...resilientQuestions, ...performanceQuestions, ...costQuestions];

const byId = new Map(QUESTIONS.map((x) => [x.id, x]));
export const getQuestion = (id: string): Question | undefined => byId.get(id);
export const questionsForSkill = (skill: string): Question[] => QUESTIONS.filter((x) => x.skill === skill);
