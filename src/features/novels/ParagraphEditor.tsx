import { useEffect, useRef, useState } from 'react';

import { HoldToDelete } from '@/components/HoldToDelete';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './ParagraphEditor.module.css';
import { deleteParagraph, saveParagraphText } from './paragraphsRepository';
import type { Paragraph } from './types';

/** Milliseconds of no typing before the paragraph is written to the database. */
const SAVE_DELAY_MS = 500;
/** How much of a collapsed paragraph is shown on its one line. */
const PREVIEW_LENGTH = 90;

interface ParagraphEditorProps {
  paragraph: Paragraph;
  position: number;
  isOpen: boolean;
  onToggle: () => void;
}

function preview(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat === '') {
    return 'Empty paragraph';
  }
  return flat.length > PREVIEW_LENGTH ? `${flat.slice(0, PREVIEW_LENGTH)}…` : flat;
}

export function ParagraphEditor({ paragraph, position, isOpen, onToggle }: ParagraphEditorProps) {
  const [text, setText] = useState(paragraph.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grow the box to fit its content instead of scrolling inside it. Runs on
  // opening too, since a hidden textarea has no height to measure.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${String(textarea.scrollHeight)}px`;
    }
  }, [text, isOpen]);

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
    <div className={styles.paragraph} data-open={isOpen}>
      <button
        type="button"
        className={styles.number}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} paragraph ${String(position)}`}
      >
        {position}
      </button>

      {isOpen ? (
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
          }}
          rows={1}
          aria-label={`Paragraph ${String(position)}`}
        />
      ) : (
        <button type="button" className={styles.preview} onClick={onToggle}>
          {preview(text)}
        </button>
      )}

      <HoldToDelete
        className={styles.delete}
        label={`Delete paragraph ${String(position)}`}
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
