import { describe, expect, it } from 'vitest';
import { CHALLENGES } from '@/data/challenges';
import { evaluateChallenge } from './challenge';

describe('architecture challenge scoring', () => {
  for (const ch of CHALLENGES) {
    it(`${ch.id}: weights sum to 100`, () => {
      expect(Object.values(ch.weights).reduce((a, b) => a + b, 0)).toBe(100);
    });
    it(`${ch.id}: reference design scores well and passes`, () => {
      const r = evaluateChallenge(ch, ch.reference);
      expect(r.total).toBeGreaterThanOrEqual(85);
      expect(r.unanswered).toEqual([]);
    });
    it(`${ch.id}: selecting every component is not a winning strategy`, () => {
      const worstDecisions = Object.fromEntries(ch.decisions.map((d) => [d.id, d.options[d.options.length - 1]!.id]));
      const all = evaluateChallenge(ch, { components: ch.components.map((c) => c.id), decisions: worstDecisions });
      expect(all.total).toBeLessThan(70);
    });
    it(`${ch.id}: an empty design does not pass`, () => {
      expect(evaluateChallenge(ch, { components: [], decisions: {} }).total).toBeLessThan(40);
    });
    it(`${ch.id}: reference ids exist`, () => {
      for (const id of ch.reference.components) expect(ch.components.some((c) => c.id === id)).toBe(true);
      for (const d of ch.decisions) expect(d.options.some((o) => o.id === ch.reference.decisions[d.id])).toBe(true);
    });
  }
});
