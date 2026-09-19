import { useLiveQuery } from 'dexie-react-hooks';
import { useSyncExternalStore } from 'react';

import { useDrive } from '@/features/drive/driveContext';

import styles from './SyncStatus.module.css';
import { getSyncState, subscribeToSync, syncNow } from './syncScheduler';
import { countPendingChanges, getSyncMeta } from './syncMeta';

function describeTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SyncStatus() {
  const { isConnected } = useDrive();
  const { isSyncing, error } = useSyncExternalStore(subscribeToSync, getSyncState);
  const pending = useLiveQuery(() => countPendingChanges());
  const meta = useLiveQuery(() => getSyncMeta());

  const waiting = pending ?? 0;
  const lastSyncedAt = meta?.lastSyncedAt ?? null;

  function describeState(): string {
    if (isSyncing) {
      return 'Syncing with Google Drive…';
    }
    if (!isConnected) {
      return waiting > 0
        ? `Saved on this device — ${String(waiting)} waiting for Drive`
        : 'Saved on this device';
    }
    if (waiting > 0) {
      return `${String(waiting)} changes not in Drive yet`;
    }
    return lastSyncedAt === null
      ? 'Nothing to sync'
      : `Everything is in Drive — last synced ${describeTime(lastSyncedAt)}`;
  }

  return (
    <div className={styles.status}>
      <span className={styles.label}>{describeState()}</span>
      <button
        type="button"
        className={styles.button}
        onClick={syncNow}
        disabled={!isConnected || isSyncing}
      >
        Sync now
      </button>
      {error !== null && <p className={styles.error}>{error}</p>}
    </div>
  );
}
