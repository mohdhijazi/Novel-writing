import { useCallback, useEffect, useState, useTransition } from 'react';

import { syncNovels } from './syncNovels';

export interface NovelSync {
  isSyncing: boolean;
  error: string | null;
  sync: () => void;
}

/**
 * Keeps the novel list in step with Drive: on connect, when the device comes
 * back online, and whenever a caller asks (after creating a novel).
 */
export function useNovelSync(isConnected: boolean): NovelSync {
  const [isSyncing, startSync] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(() => {
    if (!isConnected || !navigator.onLine) {
      return;
    }
    startSync(async () => {
      try {
        await syncNovels();
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
