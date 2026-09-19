import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { NameForm } from '@/components/NameForm';
import { requestSync } from '@/features/sync/syncScheduler';

import styles from './NovelPage.module.css';
import { createChapter, listChapters } from './chaptersRepository';
import { ExportDialog } from './ExportDialog';
import { getNovel } from './novelsRepository';

export function NovelPage() {
  const { novelId } = useParams();
  const [isExporting, setIsExporting] = useState(false);
  const novel = useLiveQuery(
    async () => (novelId === undefined ? null : await getNovel(novelId)),
    [novelId],
  );
  const chapters = useLiveQuery(
    async () => (novelId === undefined ? [] : await listChapters(novelId)),
    [novelId],
  );

  if (novel === undefined) {
    return null;
  }

  if (novel === null) {
    return <p className={styles.note}>That novel no longer exists.</p>;
  }

  function handleCreate(title: string) {
    if (novelId === undefined) {
      return;
    }
    void createChapter(novelId, title).then(() => {
      requestSync();
    });
  }

  return (
    <section className={styles.panel} aria-label={novel.title}>
      {isExporting && chapters && (
        <ExportDialog
          novel={novel}
          chapters={chapters}
          onClose={() => {
            setIsExporting(false);
          }}
        />
      )}

      <div className={styles.header}>
        <Link to=".." relative="path" className={styles.back}>
          ← All novels
        </Link>
        <div className={styles.titleRow}>
          <h2 className={styles.heading}>{novel.title}</h2>
          <button
            type="button"
            className={styles.export}
            disabled={!chapters || chapters.length === 0}
            onClick={() => {
              setIsExporting(true);
            }}
          >
            Export as PDF
          </button>
        </div>
      </div>

      <NameForm
        label="Chapter title"
        placeholder="The road at dusk"
        submitLabel="Add chapter"
        onSubmit={handleCreate}
      />

      {chapters && chapters.length > 0 ? (
        <ol className={styles.list}>
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <Link to={`chapters/${chapter.id}`} className={styles.item}>
                <span className={styles.number}>{chapter.number}</span>
                <span>{chapter.title}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.note}>No chapters yet.</p>
      )}
    </section>
  );
}
