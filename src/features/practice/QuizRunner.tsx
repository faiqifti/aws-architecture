import { ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { recordAnswer, toggleFlag } from '@/lib/progression/engine';
import { isCorrect } from '@/lib/scoring';
import type { AttemptSource, Question } from '@/types';
import { QuestionCard } from './QuestionCard';

export interface RunnerResult {
  question: Question;
  selected: string[];
  correct: boolean;
}

interface Props {
  questions: Question[];
  source: Exclude<AttemptSource, 'exam'>;
  finishLabel?: string;
  onDone: (results: RunnerResult[]) => void;
}

/** One question at a time; answers are recorded (XP, streak, missions) the moment they are submitted. */
export function QuizRunner({ questions, source, finishLabel = 'See results', onDone }: Props) {
  const { state, commit, update } = useProgress();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<RunnerResult[]>([]);

  const question = questions[index]!;
  const last = index === questions.length - 1;
  const need = question.correct.length;

  const submit = () => {
    const out = recordAnswer(state, question, selected, source);
    commit(out);
    setResults((r) => [...r, { question, selected, correct: isCorrect(question, selected) }]);
    setRevealed(true);
  };

  const next = () => {
    if (last) return onDone(results);
    setIndex((i) => i + 1);
    setSelected([]);
    setRevealed(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>Question {index + 1} of {questions.length}</span>
        <span className="tabular-nums">{results.filter((r) => r.correct).length} correct</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface2" aria-hidden>
        <div className="h-full bg-brand transition-[width]" style={{ width: `${((index + (revealed ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>
      <QuestionCard
        key={question.id}
        question={question}
        selected={selected}
        onChange={setSelected}
        revealed={revealed}
        flagged={state.flagged.includes(question.id)}
        onToggleFlag={() => update((s) => toggleFlag(s, question.id))}
      />
      <div className="flex justify-end">
        {!revealed ? (
          <button type="button" className="btn-primary" disabled={selected.length !== need} onClick={submit}>
            <Check className="h-4 w-4" /> Submit answer{need > 1 && selected.length !== need ? ` (select ${need})` : ''}
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={next} autoFocus>
            {last ? finishLabel : 'Next question'} <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
