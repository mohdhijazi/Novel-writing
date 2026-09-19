import { getStoredAccessToken } from '@/lib/google/auth';

import { syncAll } from './syncAll';
import { countPendingChanges, setLastSyncedAt } from './syncMeta';

export interface SyncState {
  isSyncing: boolean;
  error: string | null;
  /**
   * True after reconnecting with work that never reached Drive: the app asks
   * before uploading rather than doing it behind the user's back.
   */
  isOfferingSync: boolean;
  /** Changes waiting when the offer was raised. */
  offeredChanges: number;
}

let state: SyncState = {
  isSyncing: false,
  error: null,
  isOfferingSync: false,
  offeredChanges: 0,
};
const listeners = new Set<() => void>();

let timer: ReturnType<typeof setTimeout> | null = null;
let isRunning = false;
/** Set when a sync is asked for while one is already running. */
let runAgain = false;
/** While paused, automatic syncs are skipped; only an explicit sync runs. */
let isPaused = false;

function setState(next: Partial<SyncState>): void {
  state = { ...state, ...next };
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
  // Taken before the work starts, so edits made during the sync stay pending.
  const startedAt = new Date().toISOString();
  try {
    await syncAll();
    await setLastSyncedAt(startedAt);
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

function canReachDrive(): boolean {
  return getStoredAccessToken() !== null && navigator.onLine;
}

/**
 * Asks for a sync, waiting `delayMs` so a burst of edits becomes one pass.
 * Does nothing while disconnected, offline or paused — the work stays saved on
 * the device until a sync can run.
 */
export function requestSync(delayMs = 0): void {
  if (isPaused || !canReachDrive()) {
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

/** Syncs immediately at the user's request, lifting any pause. */
export function syncNow(): void {
  isPaused = false;
  setState({ isOfferingSync: false, offeredChanges: 0 });
  if (!canReachDrive()) {
    return;
  }
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  void run();
}

/**
 * Called once a connection is made. Work done while disconnected is offered
 * for upload rather than pushed automatically; with nothing pending, syncing
 * simply resumes.
 */
export async function offerSyncAfterConnect(): Promise<void> {
  isPaused = true;
  const pending = await countPendingChanges();
  if (pending === 0) {
    isPaused = false;
    requestSync();
    return;
  }
  setState({ isOfferingSync: true, offeredChanges: pending });
}

/** Declines the offer: nothing uploads until the user asks for a sync. */
export function dismissSyncOffer(): void {
  setState({ isOfferingSync: false, offeredChanges: 0 });
}

/** Delay used after typing, so writing a paragraph does not sync on every keystroke. */
export const EDIT_SYNC_DELAY_MS = 3000;
