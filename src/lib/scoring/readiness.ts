import { DOMAIN_IDS } from '@/data/domains';
import type { Attempt } from '@/types';
import { domainAccuracy } from '.';

export interface Readiness {
  /** 0–100, or null when there is not enough practice data yet. */
  score: number | null;
  label: string;
}

const FULL_COVERAGE_ATTEMPTS = 15;

/**
 * A rough study indicator: mean domain accuracy, each domain discounted until it has
 * FULL_COVERAGE_ATTEMPTS of practice. It is NOT a prediction of an official AWS result.
 */
export function estimateReadiness(attempts: Attempt[]): Readiness {
  if (attempts.length < 10) return { score: null, label: 'Not enough data' };
  const acc = domainAccuracy(attempts);
  const parts = DOMAIN_IDS.map((d) => {
    const a = acc[d];
    return ((a.accuracy ?? 0) / 100) * Math.min(1, a.attempts / FULL_COVERAGE_ATTEMPTS);
  });
  const score = Math.round((parts.reduce((s, x) => s + x, 0) / DOMAIN_IDS.length) * 100);
  const label = score < 40 ? 'Early stages' : score < 60 ? 'Building momentum' : score < 75 ? 'Approaching' : 'Strong practice results';
  return { score, label };
}
