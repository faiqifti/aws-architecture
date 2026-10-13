import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '@/data/questions';
import { recordAnswer } from '@/lib/progression/engine';
import { exportProgress, parseImport } from './backup';
import { SCHEMA_VERSION, createInitialState } from './defaults';
import { migrateState } from './migrate';

describe('migrateState', () => {
  it('returns defaults for garbage input', () => {
    for (const bad of [null, undefined, 42, 'x', [], true]) {
      const s = migrateState(bad, '2025-01-01');
      expect(s).toEqual(createInitialState('2025-01-01'));
    }
  });
  it('upgrades the legacy v0 shape', () => {
    const s = migrateState({ xpTotal: 250, completedModules: ['iam', 'vpc-security'] });
    expect(s.version).toBe(SCHEMA_VERSION);
    expect(s.xp).toBe(250);
    expect(Object.keys(s.modules).sort()).toEqual(['iam', 'vpc-security']);
  });
  it('repairs malformed fields without discarding valid ones', () => {
    const s = migrateState({
      version: 1,
      xp: 'lots',
      settings: { dailyTarget: 9999, theme: 'neon', studyMinutes: 30, reduceMotion: 'yes' },
      attempts: [{ qid: 'a', domain: 'secure', skill: 'iam', correct: true, at: '2025-01-01T00:00:00Z', source: 'practice' }, { nope: 1 }, null, 'x'],
      streak: { current: -3, longest: 'x', lastDate: 'yesterday' },
      flagged: ['q1', 5, null],
      achievements: { 'first-steps': 'not a date', ok: '2025-01-01T00:00:00Z' },
      modules: { iam: { completedAt: '2025-01-01T00:00:00Z', bestScore: 500 }, bad: 7 },
    });
    expect(s.xp).toBe(0);
    expect(s.settings.dailyTarget).toBe(100);
    expect(s.settings.theme).toBe('system');
    expect(s.settings.studyMinutes).toBe(30);
    expect(s.settings.reduceMotion).toBe(false);
    expect(s.attempts).toHaveLength(1);
    expect(s.streak).toEqual({ current: 0, longest: 0, lastDate: null });
    expect(s.flagged).toEqual(['q1']);
    expect(Object.keys(s.achievements)).toEqual(['ok']);
    expect(s.modules.iam?.bestScore).toBe(100);
    expect(s.modules.bad).toBeUndefined();
  });
  it('round-trips real progress unchanged', () => {
    const q = QUESTIONS[0]!;
    const state = recordAnswer(createInitialState('2025-06-10'), q, q.correct, 'practice', new Date(2025, 5, 10, 9)).state;
    expect(migrateState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });
});

describe('export / import', () => {
  const q = QUESTIONS[0]!;
  const state = recordAnswer(createInitialState('2025-06-10'), q, q.correct, 'practice', new Date(2025, 5, 10, 9)).state;

  it('imports a valid export', () => {
    const r = parseImport(exportProgress(state));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.xp).toBe(state.xp);
  });
  it('rejects non-JSON, foreign JSON, future versions and empty data', () => {
    expect(parseImport('{{{').ok).toBe(false);
    expect(parseImport('{"hello":1}').ok).toBe(false);
    expect(parseImport(JSON.stringify({ app: 'cloudquest', version: 99, data: {} })).ok).toBe(false);
    expect(parseImport(JSON.stringify({ app: 'cloudquest', version: 1 })).ok).toBe(false);
    expect(parseImport(JSON.stringify({ app: 'cloudquest' })).ok).toBe(false);
  });
  it('sanitises tampered data instead of trusting it', () => {
    const tampered = JSON.stringify({ app: 'cloudquest', version: 1, data: { xp: -999, attempts: 'many', settings: null } });
    const r = parseImport(tampered);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.xp).toBe(0);
      expect(r.state.attempts).toEqual([]);
    }
  });
});
