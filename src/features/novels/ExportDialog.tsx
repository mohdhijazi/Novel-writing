import { useState } from 'react';

import styles from './ExportDialog.module.css';
import { exportNovelPdf } from './exportNovelPdf';
import type { Chapter, Novel } from './types';

interface ExportDialogProps {
  novel: Novel;
  chapters: Chapter[];
  onClose: () => void;
}

export function ExportDialog({ novel, chapters, onClose }: ExportDialogProps) {
  const [chosenIds, setChosenIds] = useState(() => new Set(chapters.map((chapter) => chapter.id)));
  const [isWorking, setIsWorking] = useState(false);
  const [failed, setFailed] = useState(false);

  const chosen = chapters.filter((chapter) => chosenIds.has(chapter.id));

  function toggle(id: string) {
    setChosenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleExport() {
    setIsWorking(true);
    setFailed(false);
    exportNovelPdf(novel, chosen)
      .then(onClose)
      .catch(() => {
        setIsWorking(false);
        setFailed(true);
      });
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="export-title">
      <div className={styles.dialog}>
        <h2 id="export-title" className={styles.heading}>
          Export {novel.title}
        </h2>
        <p className={styles.note}>
          The PDF opens with a title page, then one chapter per page, in the order below.
        </p>

        <div className={styles.selectors}>
          <button
            type="button"
            className={styles.link}
            onClick={() => {
              setChosenIds(new Set(chapters.map((chapter) => chapter.id)));
            }}
          >
            Select all
          </button>
          <button
            type="button"
            className={styles.link}
            onClick={() => {
              setChosenIds(new Set());
            }}
          >
            Select none
          </button>
        </div>

        <ul className={styles.list}>
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <label className={styles.row}>
                <input
                  type="checkbox"
                  checked={chosenIds.has(chapter.id)}
                  onChange={() => {
                    toggle(chapter.id);
                  }}
                />
                <span className={styles.number}>{chapter.number}</span>
                <span>{chapter.title || 'Untitled chapter'}</span>
              </label>
            </li>
          ))}
        </ul>

        {failed && <p className={styles.error}>The PDF could not be made. Try again.</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.primary}
            disabled={chosen.length === 0 || isWorking}
            onClick={handleExport}
          >
            {isWorking
              ? 'Making the PDF…'
              : `Export ${String(chosen.length)} chapter${chosen.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
