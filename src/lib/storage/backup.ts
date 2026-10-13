import { isRecord } from '@/lib/validation/guards';
import type { AppState } from '@/types';
import { SCHEMA_VERSION } from './defaults';
import { migrateState } from './migrate';

const APP_ID = 'cloudquest';

export function exportProgress(state: AppState): string {
  return JSON.stringify({ app: APP_ID, version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data: state }, null, 2);
}

export type ImportResult = { ok: true; state: AppState; summary: string } | { ok: false; error: string };

/** Validate a backup file's contents. Nothing is applied here; the caller decides whether to replace state. */
export function parseImport(text: string): ImportResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' };
  }
  if (!isRecord(json) || json.app !== APP_ID) return { ok: false, error: 'This does not look like a CloudQuest backup file.' };
  if (typeof json.version !== 'number') return { ok: false, error: 'The backup has no schema version.' };
  if (json.version > SCHEMA_VERSION) return { ok: false, error: `This backup was made by a newer version of CloudQuest (schema ${json.version}).` };
  if (!isRecord(json.data)) return { ok: false, error: 'The backup contains no progress data.' };
  const data = { ...json.data, version: json.version };
  const state = migrateState(data);
  return { ok: true, state, summary: `${state.xp} XP, ${Object.keys(state.modules).length} modules completed, ${state.attempts.length} answers recorded.` };
}
