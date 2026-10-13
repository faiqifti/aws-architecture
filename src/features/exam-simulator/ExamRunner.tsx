import { ChevronLeft, ChevronRight, Clock, Flag, Square } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getQuestion } from '@/data/questions';
import { QuestionCard } from '@/features/practice/QuestionCard';
import type { Question } from '@/types';
import { saveActiveExam, type ActiveExam } from './activeExam';

const fmt = (sec: number) => {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${h > 0 ? `${h}:` : ''}${String(m).padStart(h > 0 ? 2 : 1, '0')}:${String(r).padStart(2, '0')}`;
};

export function ExamRunner({ initial, onSubmit }: { initial: ActiveExam; onSubmit: (exam: ActiveExam, timedOut: boolean) => void }) {
  const [exam, setExam] = useState(initial);
  const [now, setNow] = useState(() => Date.now());
  const [confirm, setConfirm] = useState(false);
  const submitted = useRef(false);
  const examRef = useRef(exam);
  examRef.current = exam;

  const questions = useMemo<Question[]>(
    () =>
      exam.questionIds.flatMap((id) => {
        const q = getQuestion(id);
        if (!q) return [];
        const order = exam.optionOrder[id];
        const options = order ? order.map((oid) => q.options.find((o) => o.id === oid)).filter((o): o is Question['options'][number] => Boolean(o)) : q.options;
        return [{ ...q, options: options.length === q.options.length ? options : q.options }];
      }),
    [exam.questionIds, exam.optionOrder],
  );

  useEffect(() => saveActiveExam(exam), [exam]);

  const remaining = Math.ceil((exam.endsAt - now) / 1000);

  const finish = (timedOut: boolean) => {
    if (submitted.current) return;
    submitted.current = true;
    onSubmit(examRef.current, timedOut);
  };

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  // Automatic submission when the clock reaches zero (also covers returning to an expired exam).
  useEffect(() => {
    if (exam.endsAt - now <= 0) finish(true);
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = questions[exam.index];
  if (!q) return null;
  const answeredCount = questions.filter((x) => (exam.answers[x.id]?.length ?? 0) > 0).length;
  const unanswered = questions.length - answeredCount;
  const low = remaining <= 300;

  const go = (i: number) => setExam((e) => ({ ...e, index: Math.max(0, Math.min(questions.length - 1, i)) }));
  const toggleMark = () => setExam((e) => ({ ...e, marked: e.marked.includes(q.id) ? e.marked.filter((x) => x !== q.id) : [...e.marked, q.id] }));

  return (
    <div className="space-y-4">
      <div className="card sticky top-12 z-20 flex flex-wrap items-center justify-between gap-3 p-3 md:top-2">
        <div className="flex items-center gap-2">
          <Clock className={`h-5 w-5 ${low ? 'text-bad' : 'text-muted'}`} aria-hidden />
          <span className="sr-only">Time remaining</span>
          <span className={`text-xl font-bold tabular-nums ${low ? 'text-bad' : ''}`} role="timer" aria-live="off">{fmt(remaining)}</span>
        </div>
        <p className="text-sm text-muted">Answered {answeredCount} of {questions.length}{exam.marked.length > 0 && ` · ${exam.marked.length} marked`}</p>
        <button type="button" className="btn-secondary" onClick={() => setConfirm(true)}><Square className="h-4 w-4" /> End exam</button>
      </div>
      <div className="sr-only" role="status" aria-live="polite">{remaining === 300 ? 'Five minutes remaining' : remaining === 60 ? 'One minute remaining' : ''}</div>

      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        <div className="space-y-4">
          <QuestionCard
            key={q.id}
            question={q}
            position={`Question ${exam.index + 1} of ${questions.length}`}
            selected={exam.answers[q.id] ?? []}
            onChange={(sel) => setExam((e) => ({ ...e, answers: { ...e.answers, [q.id]: sel } }))}
            revealed={false}
            hideDifficulty
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" className="btn-secondary" onClick={() => go(exam.index - 1)} disabled={exam.index === 0}><ChevronLeft className="h-4 w-4" /> Previous</button>
            <button type="button" className={exam.marked.includes(q.id) ? 'btn-primary' : 'btn-secondary'} aria-pressed={exam.marked.includes(q.id)} onClick={toggleMark}><Flag className="h-4 w-4" /> {exam.marked.includes(q.id) ? 'Marked for review' : 'Mark for review'}</button>
            <button type="button" className="btn-secondary" onClick={() => go(exam.index + 1)} disabled={exam.index === questions.length - 1}>Next <ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        <nav aria-label="Question navigator" className="card h-fit p-3">
          <p className="label-eyebrow mb-2">Questions</p>
          <ol className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-4">
            {questions.map((x, i) => {
              const answered = (exam.answers[x.id]?.length ?? 0) > 0;
              const marked = exam.marked.includes(x.id);
              return (
                <li key={x.id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Question ${i + 1}${answered ? ', answered' : ', unanswered'}${marked ? ', marked for review' : ''}`}
                    aria-current={i === exam.index ? 'step' : undefined}
                    className={`relative h-9 w-full rounded-md border text-sm font-semibold tabular-nums ${i === exam.index ? 'border-info ring-2 ring-info' : 'border-line'} ${answered ? 'bg-brand/20' : 'bg-surface'}`}
                  >
                    {i + 1}
                    {marked && <Flag className="absolute -right-1 -top-1 h-3.5 w-3.5 fill-brand text-brand-ink" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-xs text-muted">Shaded = answered. Flag = marked for review.</p>
        </nav>
      </div>

      <ConfirmDialog open={confirm} title="End the exam?" confirmLabel="Submit exam" onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); finish(false); }}>
        <p>
          {unanswered > 0 ? <><strong className="text-ink">{unanswered}</strong> question{unanswered === 1 ? ' is' : 's are'} unanswered and will count as incorrect. </> : 'You have answered every question. '}
          {exam.marked.length > 0 && <>{exam.marked.length} marked for review. </>}
          You cannot change answers after submitting.
        </p>
      </ConfirmDialog>
    </div>
  );
}
