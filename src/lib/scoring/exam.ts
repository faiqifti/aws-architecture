import { DOMAINS } from '@/data/domains';
import type { Question } from '@/types';
import { shuffle } from '.';

export const EXAM_FORMAT = { questions: 65, minutes: 130 };

/** Per-domain quotas that follow the official domain weights and sum exactly to `count`. */
export function domainQuotas(count: number): Record<string, number> {
  const raw = DOMAINS.map((d) => ({ id: d.id, exact: (count * d.weight) / 100 }));
  const quotas: Record<string, number> = Object.fromEntries(raw.map((r) => [r.id, Math.floor(r.exact)]));
  let left = count - Object.values(quotas).reduce((a, b) => a + b, 0);
  // Largest remainders get the leftover seats.
  for (const r of [...raw].sort((a, b) => (b.exact % 1) - (a.exact % 1))) {
    if (left <= 0) break;
    quotas[r.id]! += 1;
    left--;
  }
  return quotas;
}

/** Pick `count` questions, weighting domains like the real exam where the question bank allows. */
export function buildExam(bank: Question[], count: number, rand: () => number = Math.random): Question[] {
  const target = Math.min(count, bank.length);
  const quotas = domainQuotas(target);
  const picked: Question[] = [];
  const rest: Question[] = [];
  for (const d of DOMAINS) {
    const pool = shuffle(bank.filter((q) => q.domain === d.id), rand);
    const take = Math.min(quotas[d.id] ?? 0, pool.length);
    picked.push(...pool.slice(0, take));
    rest.push(...pool.slice(take));
  }
  // If a domain ran short, top up from whatever remains.
  picked.push(...shuffle(rest, rand).slice(0, target - picked.length));
  return shuffle(picked, rand);
}
