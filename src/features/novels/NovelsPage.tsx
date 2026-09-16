import { useLiveQuery } from 'dexie-react-hooks';

import { DriveStatus } from '@/features/drive/DriveStatus';
import { useDrive } from '@/features/drive/driveContext';

import { NewNovelForm } from './NewNovelForm';
import { NovelList } from './NovelList';
import { createNovel, listNovels } from './novelsRepository';
import { useNovelSync } from './useNovelSync';
import styles from './NovelsPage.module.css';

export function NovelsPage() {
  const { isConnected } = useDrive();
  const { isSyncing, error, sync } = useNovelSync(isConnected);
  const novels = useLiveQuery(() => listNovels());

  function handleCreate(title: string) {
    createNovel(title)
      .then(sync)
      .catch(() => {
        // Nothing to recover from: the novel is either saved locally or not.
      });
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Novels</h1>
        <DriveStatus />
      </header>

      <NewNovelForm onCreate={handleCreate} />

      {isSyncing && <p className={styles.note}>Syncing with Google Drive…</p>}
      {error !== null && <p className={styles.error}>{error}</p>}

      {novels && novels.length > 0 ? (
        <NovelList novels={novels} />
      ) : (
        <p className={styles.note}>No novels yet. Create one to get started.</p>
      )}
    </main>
  );
}
