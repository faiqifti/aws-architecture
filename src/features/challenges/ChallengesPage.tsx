import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { CHALLENGES } from '@/data/challenges';
import { domainById } from '@/data/domains';
import { useProgress } from '@/hooks/useProgress';
import { RULES, XP } from '@/lib/progression/config';

export function ChallengesPage() {
  const { state } = useProgress();
  const done = CHALLENGES.filter((c) => state.challenges[c.id]?.completedAt).length;
  return (
    <>
      <PageHeader
        title="Architecture Challenges"
        subtitle={`Choose components and make design decisions for a realistic scenario. Designs are scored against explicit criteria; ${RULES.challengePassScore}+ completes a challenge (${XP.challenge} XP, once).`}
      />
      <p className="mb-4 text-sm text-muted">{done} of {CHALLENGES.length} completed</p>
      <ul className="grid gap-4 md:grid-cols-2">
        {CHALLENGES.map((c) => {
          const rec = state.challenges[c.id];
          return (
            <li key={c.id}>
              <Link to={`/challenges/${c.id}`} className="card group flex h-full flex-col p-5 transition-colors hover:border-brand">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone="info">{domainById(c.domain).short}</Badge>
                  <Badge>{c.difficulty}</Badge>
                  {rec?.completedAt && <Badge tone="ok"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>}
                </div>
                <h2 className="font-semibold group-hover:text-brand-ink">{c.title}</h2>
                <p className="mt-1 flex-1 text-sm text-muted">{c.scenario}</p>
                <p className="mt-3 text-xs text-muted">{rec ? `Best score ${rec.bestScore}/100 · ${rec.attempts} attempt${rec.attempts === 1 ? '' : 's'}` : 'Not attempted'}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
