import { AutosaveField } from '@/components/AutosaveField';
import { HoldToDelete } from '@/components/HoldToDelete';
import { SelectField } from '@/components/SelectField';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './BeatCard.module.css';
import { deleteBeat, saveBeatField, type BeatField } from './beatsRepository';
import { SHOT_TYPES, type Beat } from './types';

/** One shot beat: the single image this moment of the scene should generate. */
export function BeatCard({ beat }: { beat: Beat }) {
  function save(field: BeatField, value: string) {
    void saveBeatField(beat.id, field, value).then(() => {
      requestSync(EDIT_SYNC_DELAY_MS);
    });
  }

  return (
    <li className={styles.card}>
      <span className={styles.number}>Beat {beat.number}</span>

      <div className={styles.fields}>
        <SelectField
          label="Shot type"
          value={beat.shotType}
          options={SHOT_TYPES}
          onChange={(value) => {
            save('shotType', value);
          }}
        />
        <AutosaveField
          label="Camera — leave empty if static"
          value={beat.camera}
          onSave={(value) => {
            save('camera', value);
          }}
        />
      </div>

      <AutosaveField
        label="Visual — one clear moment"
        value={beat.visual}
        multiline
        onSave={(value) => {
          save('visual', value);
        }}
      />

      <HoldToDelete
        className={styles.delete}
        label={`Delete beat ${String(beat.number)}`}
        onDelete={() => {
          void deleteBeat(beat.id).then(() => {
            requestSync(EDIT_SYNC_DELAY_MS);
          });
        }}
      >
        ×
      </HoldToDelete>
    </li>
  );
}
