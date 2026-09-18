import { useEffect, useSyncExternalStore } from 'react';

import { getSyncState, requestSync, subscribeToSync, type SyncState } from './syncScheduler';

/**
 * Current sync state, plus a sync whenever the Drive connection appears or the
 * device comes back online.
 */
export function useSync(isConnected: boolean): SyncState {
  const state = useSyncExternalStore(subscribeToSync, getSyncState);

  useEffect(() => {
    if (!isConnected) {
      return;
    }
    requestSync();
    const syncNow = () => {
      requestSync();
    };
    window.addEventListener('online', syncNow);
    return () => {
      window.removeEventListener('online', syncNow);
    };
  }, [isConnected]);

  return state;
}
