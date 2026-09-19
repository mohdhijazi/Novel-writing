import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './ChapterEditorPage.module.css';
import { ParagraphEditor } from './ParagraphEditor';
import { getChapter } from './chaptersRepository';
import { appendParagraph, listParagraphs } from './paragraphsRepository';

export function ChapterEditorPage() {
  const { chapterId } = useParams();
  /**
   * Everything before the last paragraph is folded behind one line by default,
   * so a long chapter opens where the writing is rather than at the top.
   */
  const [showEarlier, setShowEarlier] = useState(false);
  /**
   * Which paragraphs are open once they are on screen. Null means the default —
   * only the last one — so the list needs no correcting as paragraphs load,
   * arrive or go.
   */
  const [openIds, setOpenIds] = useState<Set<string> | null>(null);

  const chapter = useLiveQuery(
    async () => (chapterId === undefined ? null : await getChapter(chapterId)),
    [chapterId],
  );
  const paragraphs = useLiveQuery(
    async () => (chapterId === undefined ? [] : await listParagraphs(chapterId)),
    [chapterId],
  );

  if (chapter === undefined) {
    return null;
  }

  if (chapter === null) {
    return <p className={styles.note}>That chapter no longer exists.</p>;
  }

  const list = paragraphs ?? [];
  const lastId = list.at(-1)?.id;
  const defaultOpen = new Set(lastId === undefined ? [] : [lastId]);
  const open = openIds ?? defaultOpen;
  const earlierCount = Math.max(list.length - 1, 0);
  const onScreen = showEarlier ? list : list.slice(-1);
  const openCount = onScreen.filter((paragraph) => open.has(paragraph.id)).length;

  function toggle(id: string) {
    setOpenIds((current) => {
      const next = new Set(current ?? defaultOpen);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleAdd() {
    if (chapterId === undefined) {
      return;
    }
    void appendParagraph(chapterId).then((paragraph) => {
      // A new paragraph is there to be written in, so it opens even when the
      // rest of the chapter is folded away.
      setOpenIds((current) => (current === null ? null : new Set([...current, paragraph.id])));
      requestSync(EDIT_SYNC_DELAY_MS);
    });
  }

  return (
    <section className={styles.panel} aria-label={chapter.title}>
      <div className={styles.header}>
        <Link to="../.." relative="path" className={styles.back}>
          ← Chapters
        </Link>
        <h2 className={styles.heading}>
          <span className={styles.number}>Chapter {chapter.number}</span>
          {chapter.title}
        </h2>
      </div>

      {earlierCount > 0 && (
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={() => {
              setShowEarlier(true);
              setOpenIds(new Set(list.map((paragraph) => paragraph.id)));
            }}
            disabled={showEarlier && openCount === list.length}
          >
            Expand all
          </button>
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={() => {
              setShowEarlier(false);
              setOpenIds(new Set());
            }}
            disabled={!showEarlier && openCount === 0}
          >
            Collapse all
          </button>
          <span className={styles.count}>
            {openCount} of {list.length} open
          </span>
        </div>
      )}

      {earlierCount > 0 && (
        <button
          type="button"
          className={styles.earlier}
          aria-expanded={showEarlier}
          onClick={() => {
            setShowEarlier(!showEarlier);
          }}
        >
          <span aria-hidden="true">{showEarlier ? '▾' : '▸'}</span>
          {showEarlier
            ? 'Fold the earlier paragraphs away'
            : `${String(earlierCount)} earlier paragraph${earlierCount === 1 ? '' : 's'}`}
        </button>
      )}

      <div className={styles.paragraphs}>
        {onScreen.map((paragraph) => (
          <ParagraphEditor
            key={paragraph.id}
            paragraph={paragraph}
            position={list.indexOf(paragraph) + 1}
            isOpen={open.has(paragraph.id)}
            onToggle={() => {
              toggle(paragraph.id);
            }}
          />
        ))}
      </div>

      <button type="button" className={styles.add} onClick={handleAdd}>
        + Add paragraph
      </button>
    </section>
  );
}
