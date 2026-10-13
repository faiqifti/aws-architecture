import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Target, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArchitectureDiagram } from '@/components/ui/ArchitectureDiagram';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { domainById } from '@/data/domains';
import { MODULES, getModule } from '@/data/modules';
import { questionsForSkill } from '@/data/questions';
import { useProgress } from '@/hooks/useProgress';
import { completeModule, visitModule } from '@/lib/progression/engine';
import { RULES } from '@/lib/progression/config';
import { prepareQuestions, percent } from '@/lib/scoring';
import type { Question } from '@/types';
import { QuestionCard } from '@/features/practice/QuestionCard';
import { QuizRunner, type RunnerResult } from '@/features/practice/QuizRunner';

export function ModulePage() {
  const { moduleId = '' } = useParams();
  const mod = getModule(moduleId);
  const { state, commit, update } = useProgress();
  const [quiz, setQuiz] = useState<{ questions: Question[]; key: number } | null>(null);
  const [outcome, setOutcome] = useState<{ results: RunnerResult[]; passed: boolean } | null>(null);

  useEffect(() => {
    if (mod) update((s) => visitModule(s, mod.id));
    setQuiz(null);
    setOutcome(null);
  }, [mod?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mod) {
    return (
      <EmptyState icon={AlertTriangle} title="Module not found" action={<Link to="/learn" className="btn-primary">Back to Learning Path</Link>}>
        That module does not exist.
      </EmptyState>
    );
  }

  const rec = state.modules[mod.id];
  const idx = MODULES.findIndex((m) => m.id === mod.id);
  const prev = MODULES[idx - 1];
  const next = MODULES[idx + 1];
  const checkQs = questionsForSkill(mod.id);

  return (
    <article className="mx-auto max-w-3xl">
      <Link to="/learn" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Learning Path</Link>
      <header className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="info">{domainById(mod.domain).name}</Badge>
          <Badge>{mod.minutes} min</Badge>
          {rec && <Badge tone="ok"><CheckCircle2 className="h-3 w-3" /> Completed · best {rec.bestScore}%</Badge>}
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{mod.title}</h1>
        <p className="mt-2 text-muted">{mod.summary}</p>
      </header>

      <section className="card mb-6 p-5">
        <h2 className="mb-2 flex items-center gap-2 font-semibold"><Target className="h-4 w-4 text-brand-ink" aria-hidden /> Learning objectives</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {mod.objectives.map((o) => <li key={o}>{o}</li>)}
        </ul>
      </section>

      <div className="space-y-6">
        {mod.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mb-2 text-xl font-bold">{s.heading}</h2>
            {s.body.map((p, i) => <p key={i} className="mb-3 leading-relaxed">{p}</p>)}
            {s.bullets && <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
          </section>
        ))}
      </div>

      {mod.diagram && <div className="my-6"><ArchitectureDiagram diagram={mod.diagram} /></div>}

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-bold">Key AWS services</h2>
        <div className="flex flex-wrap gap-2">{mod.services.map((s) => <Badge key={s} tone="brand">{s}</Badge>)}</div>
      </section>

      <section className="mb-8 rounded-xl border border-warn/40 bg-warn/10 p-5">
        <h2 className="mb-2 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-warn" aria-hidden /> Common exam traps</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">{mod.traps.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>

      <section aria-labelledby="check" className="mb-8">
        <h2 id="check" className="mb-1 text-xl font-bold">Knowledge check</h2>
        <p className="mb-4 text-sm text-muted">{checkQs.length} questions. Score at least {Math.round(RULES.modulePassRatio * 100)}% to complete this module{rec ? ' (already completed; XP is awarded once)' : ' and earn 50 XP'}.</p>

        {!quiz && !outcome && (
          <button type="button" className="btn-primary" onClick={() => setQuiz({ questions: prepareQuestions(checkQs), key: Date.now() })}>
            {rec ? 'Retake knowledge check' : 'Start knowledge check'}
          </button>
        )}

        {quiz && !outcome && (
          <QuizRunner
            key={quiz.key}
            questions={quiz.questions}
            source="module"
            finishLabel="Finish check"
            onDone={(results) => {
              const correct = results.filter((r) => r.correct).length;
              const out = completeModule(state, mod.id, correct, results.length);
              commit(out);
              setOutcome({ results, passed: out.result.passed });
              setQuiz(null);
            }}
          />
        )}

        {outcome && (
          <div className="space-y-4">
            <div className={`card flex items-start gap-3 p-5 ${outcome.passed ? 'border-ok' : 'border-bad'}`} role="status">
              {outcome.passed ? <CheckCircle2 className="h-6 w-6 text-ok" aria-hidden /> : <XCircle className="h-6 w-6 text-bad" aria-hidden />}
              <div>
                <p className="font-semibold">{outcome.passed ? 'Module complete' : 'Not passed yet'}</p>
                <p className="text-sm text-muted">
                  You scored {percent(outcome.results.filter((r) => r.correct).length, outcome.results.length)}%.
                  {outcome.passed ? '' : ' Review the material and the explanations below, then try again.'}
                </p>
              </div>
            </div>
            {outcome.results.filter((r) => !r.correct).map((r) => (
              <QuestionCard key={r.question.id} question={r.question} selected={r.selected} onChange={() => {}} revealed />
            ))}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={() => { setOutcome(null); setQuiz({ questions: prepareQuestions(checkQs), key: Date.now() }); }}>Retake check</button>
              {outcome.passed && next && <Link to={`/learn/${next.id}`} className="btn-primary">Next module <ArrowRight className="h-4 w-4" /></Link>}
            </div>
          </div>
        )}
      </section>

      <nav aria-label="Module navigation" className="flex justify-between border-t border-line pt-4 text-sm">
        {prev ? <Link to={`/learn/${prev.id}`} className="inline-flex items-center gap-1 text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> {prev.title}</Link> : <span />}
        {next ? <Link to={`/learn/${next.id}`} className="inline-flex items-center gap-1 text-muted hover:text-ink">{next.title} <ArrowRight className="h-4 w-4" /></Link> : <span />}
      </nav>
    </article>
  );
}
