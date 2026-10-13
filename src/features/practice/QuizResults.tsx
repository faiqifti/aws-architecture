import { RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { DOMAINS } from '@/data/domains';
import { breakdownOf, percent } from '@/lib/scoring';
import type { RunnerResult } from './QuizRunner';
import { QuestionCard } from './QuestionCard';

export function QuizResults({ results, onRetryMissed, onNew }: { results: RunnerResult[]; onRetryMissed: () => void; onNew: () => void }) {
  const correct = results.filter((r) => r.correct).length;
  const pct = percent(correct, results.length);
  const byDomain = breakdownOf(results.map((r) => ({ domain: r.question.domain, correct: r.correct })));
  const missed = results.filter((r) => !r.correct);

  return (
    <div className="space-y-6">
      <section className="card p-6 text-center">
        <p className="label-eyebrow">Session score</p>
        <p className="mt-1 text-5xl font-bold tabular-nums">{pct}%</p>
        <p className="mt-1 text-muted">{correct} of {results.length} correct</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" className="btn-primary" onClick={onRetryMissed} disabled={missed.length === 0}>
            <RotateCcw className="h-4 w-4" /> Retry {missed.length} incorrect
          </button>
          <button type="button" className="btn-secondary" onClick={onNew}>New session</button>
          <Link to="/" className="btn-ghost">Dashboard</Link>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold">Domain breakdown</h2>
        <ul className="space-y-3">
          {DOMAINS.filter((d) => byDomain[d.id].total > 0).map((d) => {
            const t = byDomain[d.id];
            const p = percent(t.correct, t.total);
            return (
              <li key={d.id}>
                <div className="mb-1 flex justify-between text-sm"><span>{d.name}</span><span className="tabular-nums text-muted">{t.correct}/{t.total} · {p}%</span></div>
                <ProgressBar value={p} tone={p >= 70 ? 'ok' : 'bad'} label={d.name} />
              </li>
            );
          })}
        </ul>
      </section>

      {missed.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">Review incorrect answers <Badge tone="bad">{missed.length}</Badge></h2>
          <div className="space-y-4">
            {missed.map((r) => (
              <QuestionCard key={r.question.id} question={r.question} selected={r.selected} onChange={() => {}} revealed />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
