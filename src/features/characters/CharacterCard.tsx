import { useState } from 'react';

import { AutosaveField } from '@/components/AutosaveField';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './CharacterCard.module.css';
import { CHARACTER_FIELD_GROUPS } from './characterFields';
import { deleteCharacter, saveCharacterField } from './charactersRepository';
import { characterFullName, type Character } from './types';

export function CharacterCard({ character }: { character: Character }) {
  const [isOpen, setIsOpen] = useState(false);
  const name = characterFullName(character);

  return (
    <li className={styles.card}>
      <button
        type="button"
        className={styles.summary}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <span className={styles.name}>{name || 'Unnamed character'}</span>
        {character.role !== '' && <span className={styles.role}>{character.role}</span>}
        <span className={styles.chevron} aria-hidden="true">
          {isOpen ? '▾' : '▸'}
        </span>
      </button>

      {isOpen && (
        <div className={styles.details}>
          {CHARACTER_FIELD_GROUPS.map((group) => (
            <section key={group.title} className={styles.group}>
              <h3 className={styles.groupTitle}>{group.title}</h3>
              <div className={styles.fields}>
                {group.fields.map((definition) => (
                  <AutosaveField
                    key={definition.key}
                    label={definition.label}
                    value={character[definition.key]}
                    multiline={definition.multiline}
                    onSave={(value) => {
                      void saveCharacterField(character.id, definition.key, value).then(() => {
                        requestSync(EDIT_SYNC_DELAY_MS);
                      });
                    }}
                  />
                ))}
              </div>
            </section>
          ))}

          <button
            type="button"
            className={styles.delete}
            onClick={() => {
              void deleteCharacter(character.id).then(() => {
                requestSync(EDIT_SYNC_DELAY_MS);
              });
            }}
          >
            Delete character
          </button>
        </div>
      )}
    </li>
  );
}
