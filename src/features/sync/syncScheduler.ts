import { getStoredAccessToken } from '@/lib/google/auth';

import { syncAll } from './syncAll';

export interface SyncState {
  isSyncing: boolean;
  error: string | null;
}

let state: SyncState = { isSyncing: false, error: null };
const listeners = new Set<() => void>();

let timer: ReturnType<typeof setTimeout> | null = null;
let isRunning = false;
/** Set when a sync is asked for while one is already running. */
let runAgain = false;

function setState(next: SyncState): void {
  state = next;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSyncState(): SyncState {
  return state;
}

async function run(): Promise<void> {
  if (isRunning) {
    runAgain = true;
    return;
  }
  isRunning = true;
  setState({ isSyncing: true, error: null });
  try {
    await syncAll();
    setState({ isSyncing: false, error: null });
  } catch (cause) {
    setState({
      isSyncing: false,
      error: cause instanceof Error ? cause.message : 'Sync with Google Drive failed.',
    });
  } finally {
    isRunning = false;
  }
  if (runAgain) {
    runAgain = false;
    await run();
  }
}

/**
 * Asks for a sync, waiting `delayMs` so a burst of edits becomes one pass.
 * Does nothing while disconnected or offline; the next request picks it up.
 */
export function requestSync(delayMs = 0): void {
  if (getStoredAccessToken() === null || !navigator.onLine) {
    return;
  }
  if (timer !== null) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    timer = null;
    void run();
  }, delayMs);
}

/** Delay used after typing, so writing a paragraph does not sync on every keystroke. */
export const EDIT_SYNC_DELAY_MS = 3000;
