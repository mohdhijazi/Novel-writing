import { useEffect, useRef, useState } from 'react';

import { HoldToDelete } from '@/components/HoldToDelete';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './ParagraphEditor.module.css';
import { deleteParagraph, saveParagraphText } from './paragraphsRepository';
import type { Paragraph } from './types';

/** Milliseconds of no typing before the paragraph is written to the database. */
const SAVE_DELAY_MS = 500;

export function ParagraphEditor({ paragraph }: { paragraph: Paragraph }) {
  const [text, setText] = useState(paragraph.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grow the box to fit its content instead of scrolling inside it.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${String(textarea.scrollHeight)}px`;
    }
  }, [text]);

  useEffect(() => {
    if (text === paragraph.text) {
      return;
    }
    const timer = setTimeout(() => {
      void saveParagraphText(paragraph.id, text).then(() => {
        requestSync(EDIT_SYNC_DELAY_MS);
      });
    }, SAVE_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [text, paragraph.id, paragraph.text]);

  return (
    <div className={styles.paragraph}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
        placeholder="Write…"
        rows={1}
        aria-label="Paragraph"
      />
      <HoldToDelete
        className={styles.delete}
        label="Delete paragraph"
        onDelete={() => {
          void deleteParagraph(paragraph.id).then(() => {
            requestSync(EDIT_SYNC_DELAY_MS);
          });
        }}
      >
        ×
      </HoldToDelete>
    </div>
  );
}
