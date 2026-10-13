import { DOMAIN_IDS } from '@/data/domains';
import { DEFAULT_SETTINGS } from '@/lib/progression/config';
import {
  asArrayOf, asBool, asDateString, asEnum, asInt, asNumber, asRecordOf, asString, asStringArray, isRecord,
} from '@/lib/validation/guards';
import type {
  AppState, Attempt, ChallengeRecord, DomainBreakdown, DomainId, ExamResult, ModuleRecord, QuizResult,
} from '@/types';
import { createInitialState, SCHEMA_VERSION } from './defaults';

const DOMAINS = DOMAIN_IDS as readonly DomainId[];

function parseBreakdown(v: unknown): DomainBreakdown {
  const out = {} as DomainBreakdown;
  const src = isRecord(v) ? v : {};
  for (const d of DOMAINS) {
    const t = isRecord(src[d]) ? (src[d] as Record<string, unknown>) : {};
    out[d] = { correct: asInt(t.correct, 0, 0), total: asInt(t.total, 0, 0) };
  }
  return out;
}

function parseAttempt(v: unknown): Attempt | null {
  if (!isRecord(v) || typeof v.qid !== 'string') return null;
  return {
    qid: v.qid,
    domain: asEnum(v.domain, DOMAINS, 'secure'),
    skill: asString(v.skill),
    correct: asBool(v.correct, false),
    at: asDateString(v.at, new Date(0).toISOString()),
    source: asEnum(v.source, ['practice', 'module', 'retry', 'exam'] as const, 'practice'),
  };
}

function parseQuiz(v: unknown): QuizResult | null {
  if (!isRecord(v) || typeof v.id !== 'string') return null;
  return {
    id: v.id,
    kind: asEnum(v.kind, ['practice', 'retry', 'module'] as const, 'practice'),
    label: asString(v.label, 'Quiz'),
    at: asDateString(v.at, new Date(0).toISOString()),
    total: asInt(v.total, 0, 0),
    correct: asInt(v.correct, 0, 0),
    byDomain: parseBreakdown(v.byDomain),
  };
}

function parseExam(v: unknown): ExamResult | null {
  if (!isRecord(v) || typeof v.id !== 'string') return null;
  return {
    id: v.id,
    at: asDateString(v.at, new Date(0).toISOString()),
    total: asInt(v.total, 0, 0),
    correct: asInt(v.correct, 0, 0),
    percent: asInt(v.percent, 0, 0, 100),
    timeLimitMin: asInt(v.timeLimitMin, 0, 0),
    timeUsedSec: asInt(v.timeUsedSec, 0, 0),
    timedOut: asBool(v.timedOut, false),
    byDomain: parseBreakdown(v.byDomain),
    missedIds: asStringArray(v.missedIds),
    revisionSkills: asStringArray(v.revisionSkills),
  };
}

const parseModule = (v: unknown): ModuleRecord | null =>
  isRecord(v) ? { completedAt: asDateString(v.completedAt, new Date(0).toISOString()), bestScore: asInt(v.bestScore, 0, 0, 100) } : null;

const parseChallenge = (v: unknown): ChallengeRecord | null =>
  isRecord(v)
    ? {
        bestScore: asInt(v.bestScore, 0, 0, 100),
        attempts: asInt(v.attempts, 1, 0),
        completedAt: typeof v.completedAt === 'string' ? asDateString(v.completedAt) || null : null,
        lastAt: asDateString(v.lastAt, new Date(0).toISOString()),
      }
    : null;

const parseDateMap = (v: unknown) => asRecordOf(v, (x) => (typeof x === 'string' ? asDateString(x) || null : null));

/** Upgrade older shapes to the current one. Each step handles exactly one version. */
function upgrade(raw: Record<string, unknown>): Record<string, unknown> {
  let data = { ...raw };
  let version = asInt(data.version, 0, 0);
  if (version < 1) {
    // v0 (pre-release): XP was `xpTotal`, completed modules were a string[] of ids.
    if (data.xp === undefined && typeof data.xpTotal === 'number') data.xp = data.xpTotal;
    if (Array.isArray(data.completedModules) && data.modules === undefined) {
      const at = new Date(0).toISOString();
      data.modules = Object.fromEntries(asStringArray(data.completedModules).map((id) => [id, { completedAt: at, bestScore: 100 }]));
    }
    version = 1;
  }
  data.version = version;
  return data;
}

/**
 * Convert any unknown value into a valid current-version AppState. Never throws: anything
 * missing, malformed, or outdated is repaired or replaced with defaults.
 */
export function migrateState(raw: unknown, today?: string): AppState {
  const base = createInitialState(today);
  if (!isRecord(raw)) return base;
  const d = upgrade(raw);
  const s = isRecord(d.settings) ? d.settings : {};
  const streak = isRecord(d.streak) ? d.streak : {};
  const daily = isRecord(d.daily) ? d.daily : {};
  return {
    version: SCHEMA_VERSION,
    settings: {
      dailyTarget: asInt(s.dailyTarget, DEFAULT_SETTINGS.dailyTarget, 1, 100),
      studyMinutes: asInt(s.studyMinutes, DEFAULT_SETTINGS.studyMinutes, 5, 240),
      theme: asEnum(s.theme, ['light', 'dark', 'system'] as const, DEFAULT_SETTINGS.theme),
      reduceMotion: asBool(s.reduceMotion, DEFAULT_SETTINGS.reduceMotion),
    },
    xp: asInt(d.xp, 0, 0),
    rewards: parseDateMap(d.rewards),
    modules: asRecordOf(d.modules, parseModule),
    moduleVisits: parseDateMap(d.moduleVisits),
    attempts: asArrayOf(d.attempts, parseAttempt, 10000),
    flagged: asStringArray(d.flagged),
    quizHistory: asArrayOf(d.quizHistory, parseQuiz, 200),
    examResults: asArrayOf(d.examResults, parseExam, 100),
    challenges: asRecordOf(d.challenges, parseChallenge),
    streak: {
      current: asInt(streak.current, 0, 0),
      longest: asInt(streak.longest, 0, 0),
      lastDate: typeof streak.lastDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(streak.lastDate) ? streak.lastDate : null,
    },
    daily: {
      date: typeof daily.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(daily.date) ? daily.date : base.daily.date,
      questions: asInt(daily.questions, 0, 0),
      modules: asInt(daily.modules, 0, 0),
      challenges: asInt(daily.challenges, 0, 0),
      repeatXp: asNumber(daily.repeatXp, 0, 0),
    },
    achievements: parseDateMap(d.achievements),
  };
}
