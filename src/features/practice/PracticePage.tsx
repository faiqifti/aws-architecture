import { Play } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DOMAINS } from '@/data/domains';
import { QUESTIONS } from '@/data/questions';
import { useProgress } from '@/hooks/useProgress';
import { finishQuiz } from '@/lib/progression/engine';
import { incorrectQuestionIds, prepareQuestions } from '@/lib/scoring';
import type { DomainId, Question } from '@/types';
import { QuizResults } from './QuizResults';
import { QuizRunner, type RunnerResult } from './QuizRunner';

type Mode = 'all' | 'retry' | 'flagged';
type Phase = { name: 'setup' } | { name: 'run'; questions: Question[]; kind: 'practice' | 'retry'; label: string; run: number } | { name: 'results'; results: RunnerResult[] };

const COUNTS = [5, 10, 15, 20, 30];

export function PracticePage() {
  const { state, commit } = useProgress();
  const [params] = useSearchParams();
  const initialMode = (['retry', 'flagged'] as string[]).includes(params.get('mode') ?? '') ? (params.get('mode') as Mode) : 'all';
  const initialDomain = DOMAINS.some((d) => d.id === params.get('domain')) ? (params.get('domain') as DomainId) : 'all';

  const [mode, setMode] = useState<Mode>(initialMode);
  const [domain, setDomain] = useState<DomainId | 'all'>(initialDomain);
  const [difficulty, setDifficulty] = useState<'any' | 'easy' | 'medium' | 'hard'>('any');
  const [count, setCount] = useState(() => COUNTS.reduce((best, c) => (Math.abs(c - state.settings.studyMinutes / 2) < Math.abs(best - state.settings.studyMinutes / 2) ? c : best), 10));
  const [phase, setPhase] = useState<Phase>({ name: 'setup' });
  const [runCounter, setRunCounter] = useState(0);

  const pool = useMemo(() => {
    const wrong = new Set(incorrectQuestionIds(state.attempts));
    const flagged = new Set(state.flagged);
    return QUESTIONS.filter(
      (q) =>
        (domain === 'all' || q.domain === domain) &&
        (difficulty === 'any' || q.difficulty === difficulty) &&
        (mode === 'all' || (mode === 'retry' && wrong.has(q.id)) || (mode === 'flagged' && flagged.has(q.id))),
    );
  }, [state.attempts, state.flagged, domain, difficulty, mode]);

  const start = (questions: Question[], kind: 'practice' | 'retry', label: string, limit = Infinity) => {
    setRunCounter((n) => n + 1);
    setPhase({ name: 'run', questions: prepareQuestions(questions).slice(0, limit), kind, label, run: runCounter + 1 });
  };

  if (phase.name === 'run') {
    return (
      <>
        <PageHeader title="Practice Lab" subtitle={phase.label} />
        <QuizRunner
          key={phase.run}
          questions={phase.questions}
          source={phase.kind}
          onDone={(results) => {
            commit(finishQuiz(state, { kind: phase.kind, label: phase.label, items: results.map((r) => ({ domain: r.question.domain, correct: r.correct })) }));
            setPhase({ name: 'results', results });
          }}
        />
      </>
    );
  }

  if (phase.name === 'results') {
    const missed = phase.results.filter((r) => !r.correct).map((r) => r.question);
    return (
      <>
        <PageHeader title="Practice results" />
        <QuizResults results={phase.results} onRetryMissed={() => start(missed, 'retry', 'Retrying incorrect answers')} onNew={() => setPhase({ name: 'setup' })} />
      </>
    );
  }

  const n = Math.min(count, pool.length);
  const label = `${mode === 'retry' ? 'Retry incorrect' : mode === 'flagged' ? 'Flagged questions' : 'Practice'} · ${domain === 'all' ? 'All domains' : DOMAINS.find((d) => d.id === domain)?.short}`;

  return (
    <>
      <PageHeader title="Practice Lab" subtitle="Answer original exam-style questions one at a time. Explanations appear after you submit." />
      <div className="grid gap-6 lg:grid-cols-3">
        <form className="card space-y-5 p-5 lg:col-span-2" onSubmit={(e) => { e.preventDefault(); if (n > 0) start(pool, mode === 'retry' ? 'retry' : 'practice', label, n); }}>
          <fieldset>
            <legend className="label-eyebrow mb-2">Questions to practise</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {([
                ['all', 'Any question', QUESTIONS.length],
                ['retry', 'Incorrect answers', incorrectQuestionIds(state.attempts).length],
                ['flagged', 'Flagged as difficult', state.flagged.length],
              ] as [Mode, string, number][]).map(([id, text, total]) => (
                <label key={id} className={`cursor-pointer rounded-lg border p-3 text-sm ${mode === id ? 'border-info bg-info/10' : 'border-line hover:bg-surface2'}`}>
                  <input type="radio" name="mode" value={id} checked={mode === id} onChange={() => setMode(id)} className="mr-2 accent-[rgb(var(--info))]" />
                  <span className="font-medium">{text}</span> <span className="text-muted">({total})</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="label-eyebrow mb-1 block">Exam domain</span>
              <select value={domain} onChange={(e) => setDomain(e.target.value as DomainId | 'all')} className="w-full rounded-lg border border-line bg-surface px-3 py-2.5">
                <option value="all">All domains</option>
                {DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="label-eyebrow mb-1 block">Number of questions</span>
              <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full rounded-lg border border-line bg-surface px-3 py-2.5">
                {COUNTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="label-eyebrow mb-1 block">Difficulty</span>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} className="w-full rounded-lg border border-line bg-surface px-3 py-2.5">
                <option value="any">Any</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </label>
          </div>

          {pool.length === 0 && (
            <p className="rounded-lg bg-surface2 p-3 text-sm text-muted" role="status">
              {mode === 'retry' ? 'No incorrect answers to retry with these filters. Answer some questions first, or change the filters.' : mode === 'flagged' ? 'No flagged questions match these filters. Flag a difficult question during a quiz to collect it here.' : 'No questions match these filters.'}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary" disabled={n === 0}><Play className="h-4 w-4" /> Start {n > 0 ? `${n} questions` : 'session'}</button>
            <span className="text-sm text-muted">{pool.length} available · order randomised</span>
          </div>
        </form>

        <aside className="card p-5 text-sm">
          <h2 className="mb-2 font-semibold">How rewards work</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-muted">
            <li>First correct answer on a question: <strong className="text-ink">10 XP</strong>.</li>
            <li>Correct repeats earn 2 XP, capped at 20 XP per day, so replaying cannot be farmed.</li>
            <li>Wrong answers earn nothing but are saved so you can retry them.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
