import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { DOMAINS } from '@/data/domains';
import { getModule } from '@/data/modules';
import { getQuestion } from '@/data/questions';
import { QuestionCard } from '@/features/practice/QuestionCard';
import { percent } from '@/lib/scoring';
import type { ExamResult, Question } from '@/types';

const mmss = (s: number) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;

export function ExamResults({ result, answers, onBack }: { result: ExamResult; answers?: Record<string, string[]>; onBack: () => void }) {
  const missed = result.missedIds.map(getQuestion).filter((q): q is Question => Boolean(q));
  return (
    <div className="space-y-6">
      <section className="card p-6 text-center">
        <p className="label-eyebrow">Practice score</p>
        <p className="mt-1 text-5xl font-bold tabular-nums">{result.percent}%</p>
        <p className="mt-1 text-muted">{result.correct} of {result.total} correct · {mmss(result.timeUsedSec)} used of {result.timeLimitMin} min{result.timedOut ? ' · time expired, auto-submitted' : ''}</p>
        <p className="mx-auto mt-4 flex max-w-xl items-start gap-2 rounded-lg bg-surface2 p-3 text-left text-xs text-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          This is a percentage on CloudQuest's own practice questions. The real exam reports a scaled score (100–1,000) from a different question set, so this number cannot be converted to it and does not predict whether you will pass.
        </p>
        <button type="button" className="btn-primary mt-4" onClick={onBack}>Back to Exam Simulator</button>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold">Score by domain</h2>
        <ul className="space-y-3">
          {DOMAINS.filter((d) => result.byDomain[d.id].total > 0).map((d) => {
            const t = result.byDomain[d.id];
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

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Suggested revision topics</h2>
        {result.revisionSkills.length === 0 ? (
          <p className="text-sm text-muted">No topic fell below 70%. Keep practising a mix of domains.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {result.revisionSkills.map((id) => {
              const m = getModule(id);
              return m ? <li key={id}><Link to={`/learn/${id}`} className="btn-secondary !min-h-0 !py-1.5">{m.title}</Link></li> : null;
            })}
          </ul>
        )}
      </section>

      {missed.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">Incorrect and unanswered <Badge tone="bad">{missed.length}</Badge></h2>
          <div className="space-y-4">
            {missed.map((q) => <QuestionCard key={q.id} question={q} selected={answers?.[q.id] ?? []} onChange={() => {}} revealed />)}
          </div>
        </section>
      )}
    </div>
  );
}
