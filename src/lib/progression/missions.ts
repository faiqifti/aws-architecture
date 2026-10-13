import type { AppState, DailyState } from '@/types';
import { XP } from './config';

export type MissionId = 'module' | 'questions' | 'challenge';

export interface MissionStatus {
  id: MissionId;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: number;
  done: boolean;
}

export const missionKey = (date: string, id: MissionId) => `mission:${date}:${id}`;

/** Missions are derived from today's recorded actions, so they cannot be completed without real activity. */
export function getMissions(state: AppState): MissionStatus[] {
  const d: DailyState = state.daily;
  const defs: { id: MissionId; title: string; description: string; progress: number; target: number }[] = [
    { id: 'module', title: 'Complete a learning module', description: 'Pass a module knowledge check.', progress: d.modules, target: 1 },
    { id: 'questions', title: `Answer ${state.settings.dailyTarget} practice questions`, description: 'Any quiz counts. Target set in Settings.', progress: d.questions, target: state.settings.dailyTarget },
    { id: 'challenge', title: 'Complete an architecture scenario', description: 'Submit any architecture challenge for evaluation.', progress: d.challenges, target: 1 },
  ];
  return defs.map((m) => ({
    ...m,
    progress: Math.min(m.progress, m.target),
    reward: XP.mission,
    done: missionKey(d.date, m.id) in state.rewards,
  }));
}
