import { useCallback, useEffect, useState, useTransition } from 'react';

import { syncWorlds } from './syncWorlds';

export interface WorldSync {
  isSyncing: boolean;
  error: string | null;
  sync: () => void;
}

/**
 * Keeps the world list in step with Drive: on connect, when the device comes
 * back online, and whenever a caller asks (after creating a world).
 */
export function useWorldSync(isConnected: boolean): WorldSync {
  const [isSyncing, startSync] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(() => {
    if (!isConnected || !navigator.onLine) {
      return;
    }
    startSync(async () => {
      try {
        await syncWorlds();
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Sync with Google Drive failed.');
      }
    });
  }, [isConnected]);

  useEffect(() => {
    sync();
    window.addEventListener('online', sync);
    return () => {
      window.removeEventListener('online', sync);
    };
  }, [sync]);

  return { isSyncing, error, sync };
}
