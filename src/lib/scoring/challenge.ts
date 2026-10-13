import type { Challenge, Criterion } from '@/types';

export const CRITERIA: { id: Criterion; label: string }[] = [
  { id: 'availability', label: 'Availability' },
  { id: 'security', label: 'Security' },
  { id: 'scalability', label: 'Scalability' },
  { id: 'performance', label: 'Performance' },
  { id: 'cost', label: 'Cost' },
  { id: 'operations', label: 'Operational simplicity' },
];

export interface CriterionScore {
  id: Criterion;
  label: string;
  weight: number;
  earned: number;
  raw: number;
  target: number;
}

export interface ChallengeEvaluation {
  total: number;
  criteria: CriterionScore[];
  /** Components selected that were net-negative for this scenario. */
  harmful: string[];
  /** Decisions left unanswered. */
  unanswered: string[];
}

export interface ChallengeSelection {
  components: string[];
  decisions: Record<string, string>;
}

/**
 * Score a design against explicit criteria. Each criterion earns weight × clamp(raw / target, 0, 1),
 * so adding unnecessary components cannot raise a score and can lower cost/operations.
 */
export function evaluateChallenge(challenge: Challenge, sel: ChallengeSelection): ChallengeEvaluation {
  const raw: Record<Criterion, number> = { availability: 0, security: 0, scalability: 0, performance: 0, cost: 0, operations: 0 };
  const harmful: string[] = [];
  const add = (effects: Partial<Record<Criterion, number>>) => {
    for (const [k, v] of Object.entries(effects)) raw[k as Criterion] += v ?? 0;
  };
  for (const comp of challenge.components) {
    if (!sel.components.includes(comp.id)) continue;
    add(comp.effects);
    const net = Object.values(comp.effects).reduce((s, v) => s + (v ?? 0), 0);
    if (net < 0) harmful.push(comp.id);
  }
  const unanswered: string[] = [];
  for (const dec of challenge.decisions) {
    const chosen = dec.options.find((opt) => opt.id === sel.decisions[dec.id]);
    if (chosen) add(chosen.effects);
    else unanswered.push(dec.id);
  }
  const criteria = CRITERIA.map(({ id, label }) => {
    const weight = challenge.weights[id];
    const target = challenge.targets[id];
    // Target 0 marks a penalty-only criterion (typically cost): full marks, minus ~17% per net negative point.
    const ratio = target > 0 ? raw[id] / target : 1 + Math.min(0, raw[id]) / 6;
    return { id, label, weight, target, raw: raw[id], earned: Math.round(weight * Math.min(1, Math.max(0, ratio))) };
  });
  return { total: Math.min(100, criteria.reduce((s, x) => s + x.earned, 0)), criteria, harmful, unanswered };
}
