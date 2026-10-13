import { ACTIVE_EXAM_KEY } from '@/lib/storage/defaults';
import { isRecord, asStringArray } from '@/lib/validation/guards';

/** A running exam, persisted so a refresh does not lose the attempt or reset the clock. */
export interface ActiveExam {
  id: string;
  questionIds: string[];
  /** Option order per question id, fixed at the start so refreshes don't reshuffle. */
  optionOrder: Record<string, string[]>;
  answers: Record<string, string[]>;
  marked: string[];
  index: number;
  startedAt: number;
  endsAt: number;
  timeLimitMin: number;
}

export function loadActiveExam(): ActiveExam | null {
  try {
    const raw = localStorage.getItem(ACTIVE_EXAM_KEY);
    if (!raw) return null;
    const j: unknown = JSON.parse(raw);
    if (!isRecord(j) || typeof j.id !== 'string' || typeof j.endsAt !== 'number' || typeof j.startedAt !== 'number') return null;
    const questionIds = asStringArray(j.questionIds);
    if (questionIds.length === 0) return null;
    const answers: Record<string, string[]> = {};
    if (isRecord(j.answers)) for (const [k, v] of Object.entries(j.answers)) answers[k] = asStringArray(v);
    const optionOrder: Record<string, string[]> = {};
    if (isRecord(j.optionOrder)) for (const [k, v] of Object.entries(j.optionOrder)) optionOrder[k] = asStringArray(v);
    return {
      id: j.id,
      questionIds,
      optionOrder,
      answers,
      marked: asStringArray(j.marked),
      index: typeof j.index === 'number' ? Math.max(0, Math.min(questionIds.length - 1, Math.floor(j.index))) : 0,
      startedAt: j.startedAt,
      endsAt: j.endsAt,
      timeLimitMin: typeof j.timeLimitMin === 'number' ? j.timeLimitMin : 0,
    };
  } catch {
    return null;
  }
}

export function saveActiveExam(exam: ActiveExam | null): void {
  try {
    if (exam) localStorage.setItem(ACTIVE_EXAM_KEY, JSON.stringify(exam));
    else localStorage.removeItem(ACTIVE_EXAM_KEY);
  } catch {
    /* ignore: the exam still works in memory */
  }
}
