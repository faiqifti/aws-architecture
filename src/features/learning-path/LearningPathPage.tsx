import { CheckCircle2, Circle, Clock, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { DOMAINS } from '@/data/domains';
import { MODULES, modulesForDomain } from '@/data/modules';
import { useProgress } from '@/hooks/useProgress';

export function LearningPathPage() {
  const { state } = useProgress();
  const done = MODULES.filter((m) => m.id in state.modules).length;

  return (
    <>
      <PageHeader
        title="Learning Path"
        subtitle="Modules follow the four SAA-C03 exam domains. Each ends with a short knowledge check; pass it to complete the module and earn XP."
      />
      <div className="card mb-8 flex flex-wrap items-center gap-4 p-4">
        <div className="min-w-[200px] flex-1">
          <div className="mb-1 flex justify-between text-sm"><span className="font-medium">Overall completion</span><span className="tabular-nums text-muted">{done}/{MODULES.length} modules</span></div>
          <ProgressBar value={(done / MODULES.length) * 100} label="Overall completion" />
        </div>
        <p className="text-xs text-muted">Independent study material, not official AWS training.</p>
      </div>

      <div className="space-y-10">
        {DOMAINS.map((d) => {
          const mods = modulesForDomain(d.id);
          const n = mods.filter((m) => m.id in state.modules).length;
          return (
            <section key={d.id} aria-labelledby={`dom-${d.id}`}>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id={`dom-${d.id}`} className="text-xl font-bold">{d.name}</h2>
                  <p className="text-sm text-muted">{d.description} · {d.weight}% of the exam</p>
                </div>
                <span className="text-sm tabular-nums text-muted">{n}/{mods.length} complete</span>
              </div>
              <ul className="grid gap-3 md:grid-cols-2">
                {mods.map((m) => {
                  const rec = state.modules[m.id];
                  const visited = m.id in state.moduleVisits;
                  return (
                    <li key={m.id}>
                      <Link to={`/learn/${m.id}`} className="card group block h-full p-4 transition-colors hover:border-brand">
                        <div className="flex items-start gap-3">
                          {rec ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-hidden /> : visited ? <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden />}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold group-hover:text-brand-ink">{m.title}</h3>
                            <p className="mt-1 text-sm text-muted">{m.summary}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                              <Badge tone={rec ? 'ok' : visited ? 'info' : 'neutral'}>{rec ? `Completed · ${rec.bestScore}%` : visited ? 'In progress' : 'Not started'}</Badge>
                              <span className="inline-flex items-center gap-1 text-muted"><Clock className="h-3.5 w-3.5" aria-hidden /> {m.minutes} min</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
