import { useLiveQuery } from 'dexie-react-hooks';

import { NameForm } from '@/components/NameForm';
import { DriveStatus } from '@/features/drive/DriveStatus';
import { useDrive } from '@/features/drive/driveContext';
import { requestSync } from '@/features/sync/syncScheduler';
import { useSync } from '@/features/sync/useSync';

import { WorldList } from './WorldList';
import styles from './WorldsPage.module.css';
import { createWorld, listWorlds } from './worldsRepository';

export function WorldsPage() {
  const { isConnected } = useDrive();
  const { isSyncing, error } = useSync(isConnected);
  const worlds = useLiveQuery(() => listWorlds());

  function handleCreate(name: string) {
    createWorld(name)
      .then(() => {
        requestSync();
      })
      .catch(() => {
        // Nothing to recover from: the world is either saved locally or not.
      });
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Worlds</h1>
        <DriveStatus />
      </header>

      <NameForm
        label="World name"
        placeholder="Aetheria"
        submitLabel="Create world"
        onSubmit={handleCreate}
      />

      {isSyncing && <p className={styles.note}>Syncing with Google Drive…</p>}
      {error !== null && <p className={styles.error}>{error}</p>}

      {worlds && worlds.length > 0 ? (
        <WorldList worlds={worlds} />
      ) : (
        <p className={styles.note}>No worlds yet. Create one to get started.</p>
      )}
    </main>
  );
}
