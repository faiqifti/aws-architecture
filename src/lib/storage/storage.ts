import type { AppState } from '@/types';
import { createInitialState, STORAGE_KEY } from './defaults';
import { migrateState } from './migrate';

/** In-memory fallback so the app still works when localStorage is blocked (private mode, etc.). */
let memory: string | null = null;

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return memory;
  }
}

function write(value: string): boolean {
  memory = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
    return true;
  } catch {
    return false;
  }
}

export function loadState(): AppState {
  const raw = read();
  if (!raw) return createInitialState();
  try {
    return migrateState(JSON.parse(raw));
  } catch {
    return createInitialState();
  }
}

/** Returns false when the browser refused the write (quota/blocked). */
export function saveState(state: AppState): boolean {
  return write(JSON.stringify(state));
}

export function clearState(): void {
  memory = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
