import { useEffect, useId, useState } from 'react';

import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './CharacterField.module.css';
import type { CharacterFieldDefinition } from './characterFields';
import { saveCharacterField } from './charactersRepository';

/** Milliseconds of no typing before the field is written to the database. */
const SAVE_DELAY_MS = 500;

interface CharacterFieldProps {
  characterId: string;
  definition: CharacterFieldDefinition;
  value: string;
}

export function CharacterField({ characterId, definition, value }: CharacterFieldProps) {
  const inputId = useId();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (draft === value) {
      return;
    }
    const timer = setTimeout(() => {
      void saveCharacterField(characterId, definition.key, draft).then(() => {
        requestSync(EDIT_SYNC_DELAY_MS);
      });
    }, SAVE_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [draft, value, characterId, definition.key]);

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {definition.label}
      </label>
      {definition.multiline === true ? (
        <textarea
          id={inputId}
          className={styles.textarea}
          value={draft}
          rows={2}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
        />
      ) : (
        <input
          id={inputId}
          className={styles.input}
          value={draft}
          autoComplete="off"
          onChange={(event) => {
            setDraft(event.target.value);
          }}
        />
      )}
    </div>
  );
}
