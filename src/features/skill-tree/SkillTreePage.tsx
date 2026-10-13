import { CheckCircle2, Circle, CircleDot, Lock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { CHALLENGES } from '@/data/challenges';
import { BRANCHES, SKILLS, skillById } from '@/data/skills';
import { useProgress } from '@/hooks/useProgress';
import { SKILL_RULES } from '@/lib/progression/config';
import { STATUS_LABEL, allSkillProgress, type SkillStatus } from '@/lib/progression/skills';

const TONE: Record<SkillStatus, 'neutral' | 'info' | 'brand' | 'ok'> = { 'not-started': 'neutral', learning: 'info', practiced: 'brand', proficient: 'ok' };
const ICON = { 'not-started': Circle, learning: CircleDot, practiced: CheckCircle2, proficient: Star };

export function SkillTreePage() {
  const { state } = useProgress();
  const progress = allSkillProgress(state);
  const counts = SKILLS.reduce<Record<SkillStatus, number>>((m, s) => ({ ...m, [progress[s.id]!.status]: m[progress[s.id]!.status] + 1 }), { 'not-started': 0, learning: 0, practiced: 0, proficient: 0 });

  return (
    <>
      <PageHeader title="Skill Tree" subtitle="A competency map of the services and concepts on the exam. Status comes from your module progress and quiz accuracy, not from opening a page." />

      <section className="card mb-8 p-5" aria-labelledby="rules">
        <h2 id="rules" className="mb-2 font-semibold">How skills level up</h2>
        <ul className="grid gap-2 text-sm text-muted sm:grid-cols-2">
          <li><strong className="text-ink">Learning:</strong> you opened the module or answered a related question.</li>
          <li><strong className="text-ink">Practiced:</strong> {SKILL_RULES.practicedMinAttempts}+ answers with at least {SKILL_RULES.practicedAccuracy}% accuracy.</li>
          <li className="sm:col-span-2"><strong className="text-ink">Proficient:</strong> module completed, {SKILL_RULES.proficientMinAttempts}+ answers across {SKILL_RULES.proficientMinDistinct}+ different questions, and {SKILL_RULES.proficientAccuracy}%+ accuracy over your latest {SKILL_RULES.window} answers.</li>
        </ul>
        <p className="mt-3 flex flex-wrap gap-2 text-xs">
          {(Object.keys(counts) as SkillStatus[]).map((k) => <Badge key={k} tone={TONE[k]}>{STATUS_LABEL[k]}: {counts[k]}</Badge>)}
        </p>
      </section>

      <div className="space-y-8">
        {BRANCHES.map((b) => {
          const skills = SKILLS.filter((s) => s.branch === b.id);
          return (
            <section key={b.id} aria-labelledby={`b-${b.id}`}>
              <h2 id={`b-${b.id}`} className="mb-3 text-lg font-bold">{b.name}</h2>
              <ul className="relative grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {skills.map((s) => {
                  const p = progress[s.id]!;
                  const Icon = ICON[p.status];
                  const related = CHALLENGES.filter((c) => c.skills.includes(s.id));
                  const prereqs = s.prerequisites.map((id) => ({ id, name: skillById(id)?.name ?? id, met: progress[id]?.moduleCompleted ?? false }));
                  const blocked = prereqs.some((x) => !x.met);
                  return (
                    <li key={s.id} className="card flex flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="flex items-center gap-2 font-semibold"><Icon className={`h-5 w-5 shrink-0 ${p.status === 'proficient' ? 'text-ok' : p.status === 'not-started' ? 'text-muted' : 'text-brand-ink'}`} aria-hidden />{s.name}</h3>
                        <Badge tone={TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                      </div>
                      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-surface2 p-2"><dt className="text-muted">Accuracy</dt><dd className="text-base font-bold tabular-nums">{p.accuracy === null ? '—' : `${p.accuracy}%`}</dd></div>
                        <div className="rounded-lg bg-surface2 p-2"><dt className="text-muted">Answers</dt><dd className="text-base font-bold tabular-nums">{p.attempts}</dd></div>
                        <div className="rounded-lg bg-surface2 p-2"><dt className="text-muted">Module</dt><dd className="text-base font-bold">{p.moduleCompleted ? 'Done' : 'Open'}</dd></div>
                      </dl>
                      <div className="mt-3 flex-1 space-y-1.5 text-xs text-muted">
                        <p>Module: <Link className="font-medium text-info underline-offset-2 hover:underline" to={`/learn/${s.id}`}>Study {s.name}</Link></p>
                        {related.length > 0 && <p>Challenges: {related.map((c, i) => <span key={c.id}>{i > 0 && ', '}<Link className="font-medium text-info underline-offset-2 hover:underline" to={`/challenges/${c.id}`}>{c.title}</Link></span>)}</p>}
                        {prereqs.length > 0 && (
                          <p className="flex flex-wrap items-center gap-1">
                            {blocked && <Lock className="h-3.5 w-3.5" aria-hidden />} Recommended first:{' '}
                            {prereqs.map((x) => <span key={x.id} className={x.met ? 'text-ok' : ''}>{x.name}{x.met ? ' ✓' : ''}</span>).reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, ', ', el] : [el]), [])}
                          </p>
                        )}
                      </div>
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
