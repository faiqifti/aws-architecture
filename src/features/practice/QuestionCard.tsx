import { CheckCircle2, Flag, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { domainById } from '@/data/domains';
import { isCorrect } from '@/lib/scoring';
import type { Question } from '@/types';

interface Props {
  question: Question;
  selected: string[];
  onChange: (selected: string[]) => void;
  /** When true, show correctness and explanations and lock the inputs. */
  revealed: boolean;
  flagged?: boolean;
  onToggleFlag?: () => void;
  position?: string;
  /** Hide per-option feedback (used in the timed exam). */
  hideDifficulty?: boolean;
}

const LETTERS = 'ABCDEF';

export function QuestionCard({ question, selected, onChange, revealed, flagged, onToggleFlag, position, hideDifficulty }: Props) {
  const multi = question.correct.length > 1;
  const correct = revealed && isCorrect(question, selected);
  const name = `q-${question.id}`;

  const toggle = (id: string) => {
    if (revealed) return;
    if (!multi) return onChange([id]);
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  return (
    <article className="card p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {position && <span className="text-sm font-semibold text-muted">{position}</span>}
        <Badge tone="info">{domainById(question.domain).short}</Badge>
        {!hideDifficulty && <Badge>{question.difficulty}</Badge>}
        {onToggleFlag && (
          <button type="button" onClick={onToggleFlag} aria-pressed={flagged} className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium ${flagged ? 'bg-brand/15 text-brand-ink' : 'text-muted hover:bg-surface2'}`}>
            <Flag className="h-4 w-4" aria-hidden /> {flagged ? 'Flagged as difficult' : 'Flag as difficult'}
          </button>
        )}
      </div>

      <fieldset>
        <legend className="text-base font-semibold leading-relaxed sm:text-lg">{question.text}</legend>
        <p className="mt-2 text-sm text-muted">{multi ? `Select ${question.correct.length} answers.` : 'Select 1 answer.'}</p>
        <div className="mt-4 space-y-2.5">
          {question.options.map((opt, i) => {
            const isSel = selected.includes(opt.id);
            const isRight = question.correct.includes(opt.id);
            let tone = isSel ? 'border-info bg-info/10' : 'border-line hover:bg-surface2';
            if (revealed) tone = isRight ? 'border-ok bg-ok/10' : isSel ? 'border-bad bg-bad/10' : 'border-line opacity-90';
            return (
              <div key={opt.id}>
                <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${tone} ${revealed ? 'cursor-default' : ''}`}>
                  <input
                    type={multi ? 'checkbox' : 'radio'}
                    name={name}
                    checked={isSel}
                    disabled={revealed}
                    onChange={() => toggle(opt.id)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[rgb(var(--info))]"
                  />
                  <span className="min-w-0 flex-1 text-sm leading-relaxed sm:text-base">
                    <span className="mr-2 font-semibold text-muted">{LETTERS[i]}.</span>
                    {opt.text}
                  </span>
                  {revealed && isRight && <CheckCircle2 className="h-5 w-5 shrink-0 text-ok" aria-label="Correct answer" />}
                  {revealed && !isRight && isSel && <XCircle className="h-5 w-5 shrink-0 text-bad" aria-label="Your incorrect choice" />}
                </label>
                {revealed && <p className="ml-8 mt-1 text-sm text-muted"><strong className="font-semibold text-ink">{isRight ? 'Why it is correct: ' : 'Why not: '}</strong>{opt.why}</p>}
              </div>
            );
          })}
        </div>
      </fieldset>

      {revealed && (
        <div className={`mt-5 rounded-lg border p-4 ${correct ? 'border-ok/40 bg-ok/5' : 'border-bad/40 bg-bad/5'}`} role="status">
          <p className={`font-semibold ${correct ? 'text-ok' : 'text-bad'}`}>{correct ? 'Correct' : 'Not quite'}</p>
          <p className="mt-1 text-sm leading-relaxed">{question.explanation}</p>
          <p className="mt-2 text-sm"><strong>Takeaway:</strong> {question.takeaway}</p>
          <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {question.services.map((s) => <Badge key={s}>{s}</Badge>)}
          </p>
        </div>
      )}
    </article>
  );
}
