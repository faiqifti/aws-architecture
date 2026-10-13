import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { rollDaily } from '@/lib/progression/engine';
import { clearState, loadState, saveState } from '@/lib/storage/storage';
import { createInitialState } from '@/lib/storage/defaults';
import { toDateKey } from '@/lib/streaks';
import type { AppState, GameEvent } from '@/types';

export interface Toast {
  id: number;
  event: GameEvent;
}

interface ProgressContextValue {
  state: AppState;
  /** Apply a pure state transition and surface its game events as toasts. */
  commit: (outcome: { state: AppState; events: GameEvent[] }) => void;
  update: (fn: (s: AppState) => AppState) => void;
  replaceState: (next: AppState) => void;
  resetAll: () => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  storageOk: boolean;
}

const Ctx = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => rollDaily(loadState(), toDateKey()));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [storageOk, setStorageOk] = useState(true);
  const stateRef = useRef(state);
  const nextToast = useRef(1);

  useEffect(() => {
    stateRef.current = state;
    setStorageOk(saveState(state));
  }, [state]);

  // Reset daily counters when the date changes while the app stays open.
  useEffect(() => {
    const check = () => setState((s) => rollDaily(s, toDateKey()));
    const id = window.setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  // Keep several open tabs consistent.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cloudquest:v1') setState(loadState());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const pushToasts = useCallback((events: GameEvent[]) => {
    if (events.length === 0) return;
    const added = events.map((event) => ({ id: nextToast.current++, event }));
    setToasts((t) => [...t, ...added].slice(-5));
  }, []);

  const commit = useCallback<ProgressContextValue['commit']>(
    (o) => {
      stateRef.current = o.state;
      setState(o.state);
      pushToasts(o.events);
    },
    [pushToasts],
  );

  const update = useCallback((fn: (s: AppState) => AppState) => {
    const next = fn(stateRef.current);
    stateRef.current = next;
    setState(next);
  }, []);

  const replaceState = useCallback((next: AppState) => {
    stateRef.current = next;
    setState(rollDaily(next, toDateKey()));
  }, []);

  const resetAll = useCallback(() => {
    clearState();
    const fresh = createInitialState();
    stateRef.current = fresh;
    setState(fresh);
    setToasts([]);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // Apply theme and motion preferences.
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => root.classList.toggle('dark', state.settings.theme === 'dark' || (state.settings.theme === 'system' && mq.matches));
    apply();
    mq.addEventListener('change', apply);
    root.dataset.motion = state.settings.reduceMotion ? 'reduced' : 'full';
    return () => mq.removeEventListener('change', apply);
  }, [state.settings.theme, state.settings.reduceMotion]);

  const value = useMemo(
    () => ({ state, commit, update, replaceState, resetAll, toasts, dismissToast, storageOk }),
    [state, commit, update, replaceState, resetAll, toasts, dismissToast, storageOk],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgress must be used inside ProgressProvider');
  return v;
}
