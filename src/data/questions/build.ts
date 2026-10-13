import type { Difficulty, DomainId, Question } from '@/types';

/** [option text, why it is right or wrong] */
export type Opt = [text: string, why: string];

const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'];

/**
 * Compact authoring helper. `correct` holds indexes into `opts`.
 * All questions are original study material, not actual AWS exam questions.
 */
export function q(
  id: string,
  domain: DomainId,
  skill: string,
  difficulty: Difficulty,
  text: string,
  opts: Opt[],
  correct: number[],
  explanation: string,
  takeaway: string,
  services: string[],
): Question {
  return {
    id,
    domain,
    skill,
    difficulty,
    text,
    options: opts.map(([t, why], i) => ({ id: LETTERS[i]!, text: t, why })),
    correct: correct.map((i) => LETTERS[i]!),
    explanation,
    takeaway,
    services,
  };
}
