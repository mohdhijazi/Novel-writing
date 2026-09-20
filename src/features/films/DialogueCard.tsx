import { AutosaveField } from '@/components/AutosaveField';
import { HoldToDelete } from '@/components/HoldToDelete';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './DialogueCard.module.css';
import {
  deleteDialogueLine,
  saveDialogueBeat,
  saveDialogueField,
  type DialogueField,
} from './dialogueRepository';
import type { DialogueLine } from './types';

/** One spoken line: the source for the dub and the subtitles. */
export function DialogueCard({ line }: { line: DialogueLine }) {
  function save(field: DialogueField, value: string) {
    void saveDialogueField(line.id, field, value).then(() => {
      requestSync(EDIT_SYNC_DELAY_MS);
    });
  }

  return (
    <li className={styles.card}>
      <div className={styles.fields}>
        <AutosaveField
          label="Speaker"
          value={line.speaker}
          onSave={(value) => {
            save('speaker', value);
          }}
        />
        <AutosaveField
          label="Delivery — only when it is needed"
          value={line.delivery}
          onSave={(value) => {
            save('delivery', value);
          }}
        />
        <AutosaveField
          label="Beat it plays over"
          value={line.beatNumber === 0 ? '' : String(line.beatNumber)}
          numeric
          onSave={(value) => {
            const beat = Number.parseInt(value, 10);
            void saveDialogueBeat(line.id, Number.isNaN(beat) ? 0 : beat).then(() => {
              requestSync(EDIT_SYNC_DELAY_MS);
            });
          }}
        />
      </div>

      <AutosaveField
        label="Line — no stage direction in it"
        value={line.line}
        multiline
        onSave={(value) => {
          save('line', value);
        }}
      />

      <HoldToDelete
        className={styles.delete}
        label={`Delete line ${line.speaker || String(line.order)}`}
        onDelete={() => {
          void deleteDialogueLine(line.id).then(() => {
            requestSync(EDIT_SYNC_DELAY_MS);
          });
        }}
      >
        ×
      </HoldToDelete>
    </li>
  );
}
