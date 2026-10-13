import { History, Play } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { QUESTIONS, getQuestion } from '@/data/questions';
import { useProgress } from '@/hooks/useProgress';
import { RULES, XP } from '@/lib/progression/config';
import { completeExam } from '@/lib/progression/engine';
import { evaluateExam, percent, prepareQuestion } from '@/lib/scoring';
import { EXAM_FORMAT, buildExam } from '@/lib/scoring/exam';
import type { ExamResult, Question } from '@/types';
import { loadActiveExam, saveActiveExam, type ActiveExam } from './activeExam';
import { ExamResults } from './ExamResults';
import { ExamRunner } from './ExamRunner';

const COUNTS = [10, 20, 30, 40, 65];
const MINUTES = [15, 30, 45, 60, 90, 130];

type View = { name: 'setup' } | { name: 'run' } | { name: 'results'; result: ExamResult; answers?: Record<string, string[]> };

export function ExamPage() {
  const { state, commit } = useProgress();
  const [active, setActive] = useState<ActiveExam | null>(() => loadActiveExam());
  const [view, setView] = useState<View>(() => (loadActiveExam() ? { name: 'run' } : { name: 'setup' }));
  const [format, setFormat] = useState(false);
  const [count, setCount] = useState(20);
  const [minutes, setMinutes] = useState(30);

  const bank = QUESTIONS.length;
  const effCount = Math.min(format ? EXAM_FORMAT.questions : count, bank);
  const effMinutes = format ? EXAM_FORMAT.minutes : minutes;

  const start = () => {
    const picked = buildExam(QUESTIONS, effCount);
    const optionOrder: Record<string, string[]> = {};
    for (const q of picked) optionOrder[q.id] = prepareQuestion(q).options.map((o) => o.id);
    const now = Date.now();
    const exam: ActiveExam = {
      id: `exam-${now}`, questionIds: picked.map((q) => q.id), optionOrder, answers: {}, marked: [], index: 0,
      startedAt: now, endsAt: now + effMinutes * 60_000, timeLimitMin: effMinutes,
    };
    saveActiveExam(exam);
    setActive(exam);
    setView({ name: 'run' });
  };

  const submit = (exam: ActiveExam, timedOut: boolean) => {
    const questions = exam.questionIds.map(getQuestion).filter((q): q is Question => Boolean(q));
    const ev = evaluateExam(questions, exam.answers);
    const nowMs = Date.now();
    const result: ExamResult = {
      id: exam.id,
      at: new Date(nowMs).toISOString(),
      total: ev.total,
      correct: ev.correct,
      percent: ev.percent,
      timeLimitMin: exam.timeLimitMin,
      timeUsedSec: Math.max(0, Math.round((Math.min(nowMs, exam.endsAt) - exam.startedAt) / 1000)),
      timedOut,
      byDomain: ev.byDomain,
      missedIds: ev.missedIds,
      revisionSkills: ev.revisionSkills,
    };
    const answered = questions.filter((q) => (exam.answers[q.id]?.length ?? 0) > 0).map((q) => ({ question: q, correct: !ev.missedIds.includes(q.id) }));
    commit(completeExam(state, result, answered));
    saveActiveExam(null);
    setActive(null);
    setView({ name: 'results', result, answers: exam.answers });
  };

  if (view.name === 'run' && active) {
    return (
      <>
        <PageHeader title="Mock exam in progress" subtitle="Answers are saved as you go. If you refresh, the clock keeps running." />
        <ExamRunner key={active.id} initial={active} onSubmit={submit} />
      </>
    );
  }

  if (view.name === 'results') {
    return (
      <>
        <PageHeader title="Exam results" />
        <ExamResults result={view.result} answers={view.answers} onBack={() => setView({ name: 'setup' })} />
      </>
    );
  }

  const history = [...state.examResults].reverse();
  return (
    <>
      <PageHeader title="Exam Simulator" subtitle="A timed, uninterrupted mock exam with no feedback until you finish. Practise pacing and review mistakes afterwards." />
      <div className="grid gap-6 lg:grid-cols-3">
        <form className="card space-y-5 p-5 lg:col-span-2" onSubmit={(e) => { e.preventDefault(); start(); }}>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3">
            <input type="checkbox" checked={format} onChange={(e) => setFormat(e.target.checked)} className="mt-1 h-4 w-4 accent-[rgb(var(--info))]" />
            <span className="text-sm">
              <span className="font-semibold">Simulate the actual exam format</span>
              <span className="block text-muted">{EXAM_FORMAT.questions} questions in {EXAM_FORMAT.minutes} minutes{bank < EXAM_FORMAT.questions ? `. This question bank has ${bank} questions, so the exam will use all ${bank}.` : '.'}</span>
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="label-eyebrow mb-1 block">Number of questions</span>
              <select disabled={format} value={format ? effCount : count} onChange={(e) => setCount(Number(e.target.value))} className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 disabled:opacity-60">
                {(format ? [effCount] : COUNTS.filter((c) => c <= bank)).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="label-eyebrow mb-1 block">Time limit</span>
              <select disabled={format} value={effMinutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 disabled:opacity-60">
                {MINUTES.map((m) => <option key={m} value={m}>{m} minutes</option>)}
              </select>
            </label>
          </div>

          <p className="text-sm text-muted">Questions follow the official domain weighting where possible (30 / 26 / 24 / 20%). Unanswered questions count as incorrect. Completion XP applies to exams of {RULES.minExamQuestions}+ questions: {XP.examFirst} XP the first time, then {XP.examImprovement} XP only when you beat your best score.</p>
          <button type="submit" className="btn-primary"><Play className="h-4 w-4" /> Start {effCount}-question exam</button>
        </form>

        <aside className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><History className="h-4 w-4 text-muted" aria-hidden /> Past attempts</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted">No exams yet. Your results and revision suggestions will be listed here.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {history.slice(0, 8).map((r) => (
                <li key={r.id}>
                  <button type="button" className="flex w-full items-center justify-between gap-2 rounded-lg bg-surface2/60 px-3 py-2 text-left hover:bg-surface2" onClick={() => setView({ name: 'results', result: r })}>
                    <span>{new Date(r.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {r.total} q</span>
                    <strong className="tabular-nums">{r.percent}%</strong>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {state.examResults.length > 0 && <p className="mt-3 text-xs text-muted">Best: {Math.max(...state.examResults.map((r) => r.percent))}% · {percent(state.examResults.filter((r) => r.percent >= RULES.examReadyThreshold).length, state.examResults.length)}% of attempts at or above {RULES.examReadyThreshold}%</p>}
        </aside>
      </div>
    </>
  );
}
