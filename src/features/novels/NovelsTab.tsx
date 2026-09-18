import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';

import { NameForm } from '@/components/NameForm';
import { requestSync } from '@/features/sync/syncScheduler';

import styles from './NovelsTab.module.css';
import { createNovel, listNovels } from './novelsRepository';

export function NovelsTab() {
  const { worldId } = useParams();
  const novels = useLiveQuery(
    async () => (worldId === undefined ? [] : await listNovels(worldId)),
    [worldId],
  );

  function handleCreate(title: string) {
    if (worldId === undefined) {
      return;
    }
    void createNovel(worldId, title).then(() => {
      requestSync();
    });
  }

  return (
    <section className={styles.panel} aria-label="Novels">
      <NameForm
        label="Novel title"
        placeholder="The Glass Road"
        submitLabel="Add novel"
        onSubmit={handleCreate}
      />

      {novels && novels.length > 0 ? (
        <ul className={styles.list}>
          {novels.map((novel) => (
            <li key={novel.id}>
              <Link to={novel.id} className={styles.item}>
                {novel.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.note}>No novels yet.</p>
      )}
    </section>
  );
}
