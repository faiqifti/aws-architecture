import {
  ArrowRight, BookOpen, CheckCircle2, Flame, FlaskConical, Gauge, History, ListChecks, Percent, RotateCcw, Sparkles, Target, Timer, Trophy, Workflow,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DomainBars } from '@/components/charts/DomainBars';
import { RadialGauge } from '@/components/charts/RadialGauge';
import { ScoreTrend } from '@/components/charts/ScoreTrend';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatTile } from '@/components/ui/StatTile';
import { DOMAINS } from '@/data/domains';
import { MODULES, getModule } from '@/data/modules';
import { useProgress } from '@/hooks/useProgress';
import { liveStreak } from '@/lib/progression/engine';
import { levelInfo } from '@/lib/progression/levels';
import { getMissions } from '@/lib/progression/missions';
import { recommend } from '@/lib/progression/recommendations';
import { accuracyOf, domainAccuracy, incorrectQuestionIds, percent, weakestDomain } from '@/lib/scoring';
import { estimateReadiness } from '@/lib/scoring/readiness';

const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export function DashboardPage() {
  const { state } = useProgress();
  const info = levelInfo(state.xp);
  const streak = liveStreak(state);
  const acc = accuracyOf(state.attempts);
  const completion = percent(Object.keys(state.modules).length, MODULES.length);
  const readiness = estimateReadiness(state.attempts);
  const missions = getMissions(state);
  const weak = weakestDomain(state.attempts);
  const domAcc = domainAccuracy(state.attempts);
  const wrongCount = incorrectQuestionIds(state.attempts).length;
  const recs = recommend(state);
  const isNew = state.attempts.length === 0 && Object.keys(state.modules).length === 0;

  const recent = Object.entries(state.moduleVisits)
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, 4)
    .map(([id, at]) => ({ mod: getModule(id), at }))
    .filter((x) => x.mod);
  const quizzes = state.quizHistory.slice(-5).reverse();
  const trend = state.quizHistory.slice(-8).map((q) => ({ label: `${q.label} (${when(q.at)})`, percent: percent(q.correct, q.total) }));

  return (
    <>
      <PageHeader
        title={isNew ? 'Welcome to CloudQuest' : 'Your learning dashboard'}
        subtitle="Study for the AWS Certified Solutions Architect – Associate (SAA-C03) with modules, practice questions, architecture scenarios and mock exams. Progress is saved in this browser."
      />

      {isNew && (
        <section className="card mb-6 flex flex-wrap items-center justify-between gap-4 border-brand p-5">
          <div>
            <h2 className="font-semibold">Start your first module</h2>
            <p className="text-sm text-muted">Learn a topic, pass its short knowledge check, and earn your first 50 XP.</p>
          </div>
          <Link to="/learn/iam" className="btn-primary">Begin with IAM <ArrowRight className="h-4 w-4" /></Link>
        </section>
      )}

      <section aria-label="Progress overview" className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Trophy} label="Level" value={info.level} hint={info.title} />
        <StatTile icon={Sparkles} label="Total XP" value={info.xp.toLocaleString()} hint={`${info.xpNeeded - info.xpIntoLevel} XP to level ${info.level + 1}`} />
        <StatTile icon={Flame} label="Streak" value={`${streak} day${streak === 1 ? '' : 's'}`} hint={`Longest: ${state.streak.longest}`} />
        <StatTile icon={ListChecks} label="Questions" value={state.attempts.length} hint="answered in total" />
        <StatTile icon={Percent} label="Accuracy" value={acc === null ? '—' : `${acc}%`} hint={acc === null ? 'Answer a question to begin' : 'across all answers'} />
        <StatTile icon={BookOpen} label="Completion" value={`${completion}%`} hint={`${Object.keys(state.modules).length}/${MODULES.length} modules`} />
        <div className="card col-span-2 flex items-center gap-4 p-4">
          <RadialGauge value={readiness.score} label="Estimated exam readiness" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-muted"><Gauge className="h-4 w-4" aria-hidden /><span className="text-xs font-semibold uppercase tracking-wide">Exam readiness</span></div>
            <p className="font-semibold">{readiness.label}</p>
            <p className="text-xs text-muted">A rough study indicator from your practice accuracy and coverage, not a prediction of an official AWS result.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5" aria-labelledby="missions">
            <h2 id="missions" className="mb-4 flex items-center gap-2 font-semibold"><Target className="h-4 w-4 text-brand-ink" aria-hidden /> Daily missions</h2>
            <ul className="space-y-4">
              {missions.map((m) => (
                <li key={m.id}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {m.done ? <CheckCircle2 className="h-4 w-4 text-ok" aria-hidden /> : <span className="h-4 w-4 rounded-full border border-line" aria-hidden />}
                      {m.title}
                    </span>
                    <span className="flex items-center gap-2 text-xs">
                      <Badge tone={m.done ? 'ok' : 'neutral'}>{m.done ? 'Complete' : 'In progress'}</Badge>
                      <Badge tone="brand">+{m.reward} XP</Badge>
                    </span>
                  </div>
                  <ProgressBar value={(m.progress / m.target) * 100} tone={m.done ? 'ok' : 'brand'} label={m.title} />
                  <p className="mt-1 text-xs text-muted">{m.progress}/{m.target} · {m.description}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5" aria-labelledby="domains">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="domains" className="font-semibold">Performance by exam domain</h2>
              {weak ? <span className="text-sm text-muted">Focus area: <strong className="text-ink">{DOMAINS.find((d) => d.id === weak)?.short}</strong></span> : <span className="text-sm text-muted">Weakest domain appears after 5+ answers in a domain</span>}
            </div>
            <DomainBars
              highlight={weak}
              data={Object.fromEntries(
                DOMAINS.map((d) => {
                  const mods = MODULES.filter((m) => m.domain === d.id);
                  const done = mods.filter((m) => m.id in state.modules).length;
                  return [d.id, { accuracy: domAcc[d.id].accuracy, detail: `${domAcc[d.id].attempts} answers · ${done}/${mods.length} modules · ${d.weight}% of exam` }];
                }),
              ) as Parameters<typeof DomainBars>[0]['data']}
            />
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="card p-5" aria-labelledby="recent-mods">
              <h2 id="recent-mods" className="mb-3 flex items-center gap-2 font-semibold"><History className="h-4 w-4 text-muted" aria-hidden /> Recently studied</h2>
              {recent.length === 0 ? (
                <EmptyState icon={BookOpen} title="No modules yet" action={<Link to="/learn" className="btn-secondary">Browse modules</Link>}>Modules you open will appear here.</EmptyState>
              ) : (
                <ul className="space-y-2">
                  {recent.map(({ mod, at }) => (
                    <li key={mod!.id}>
                      <Link to={`/learn/${mod!.id}`} className="flex items-center justify-between gap-2 rounded-lg p-2 text-sm hover:bg-surface2">
                        <span className="min-w-0 truncate font-medium">{mod!.title}</span>
                        <span className="shrink-0 text-xs text-muted">{mod!.id in state.modules ? 'Completed' : 'In progress'} · {when(at)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card p-5" aria-labelledby="recent-quiz">
              <h2 id="recent-quiz" className="mb-3 font-semibold">Recent quiz results</h2>
              {quizzes.length === 0 ? (
                <EmptyState icon={FlaskConical} title="No quizzes yet" action={<Link to="/practice" className="btn-secondary">Start practising</Link>}>Completed practice sessions are listed here.</EmptyState>
              ) : (
                <>
                  <ul className="space-y-2 text-sm">
                    {quizzes.map((q) => (
                      <li key={q.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface2/60 px-3 py-2">
                        <span className="min-w-0 truncate">{q.label}</span>
                        <span className="shrink-0 tabular-nums"><strong>{percent(q.correct, q.total)}%</strong> <span className="text-xs text-muted">({q.correct}/{q.total}) · {when(q.at)}</span></span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3"><ScoreTrend points={trend} /></div>
                </>
              )}
            </section>
          </div>
        </div>

        <div className="space-y-6">
          <section className="card p-5" aria-labelledby="quick">
            <h2 id="quick" className="mb-3 font-semibold">Quick actions</h2>
            <div className="grid gap-2">
              <Link to={recs.find((r) => r.to.startsWith('/learn/'))?.to ?? '/learn'} className="btn-primary justify-start"><BookOpen className="h-4 w-4" /> Continue learning</Link>
              <Link to="/practice" className="btn-secondary justify-start"><FlaskConical className="h-4 w-4" /> Start a practice session</Link>
              <Link to="/practice?mode=retry" className={`btn-secondary justify-start ${wrongCount === 0 ? 'opacity-60' : ''}`}><RotateCcw className="h-4 w-4" /> Retry incorrect questions {wrongCount > 0 && <Badge tone="bad">{wrongCount}</Badge>}</Link>
              <Link to="/challenges" className="btn-secondary justify-start"><Workflow className="h-4 w-4" /> Start an architecture challenge</Link>
              <Link to="/exam" className="btn-secondary justify-start"><Timer className="h-4 w-4" /> Take a mock exam</Link>
            </div>
          </section>

          <section className="card p-5" aria-labelledby="next">
            <h2 id="next" className="mb-3 font-semibold">Recommended next</h2>
            {recs.length === 0 ? (
              <p className="text-sm text-muted">You have worked through everything. Try a full-length mock exam to confirm.</p>
            ) : (
              <ul className="space-y-3">
                {recs.map((r) => (
                  <li key={r.id}>
                    <Link to={r.to} className="group block rounded-lg border border-line p-3 hover:border-brand">
                      <p className="text-sm font-semibold group-hover:text-brand-ink">{r.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{r.reason}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
