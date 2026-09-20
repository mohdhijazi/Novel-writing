import { useLiveQuery } from 'dexie-react-hooks';

import { AutosaveField } from '@/components/AutosaveField';
import { HoldToDelete } from '@/components/HoldToDelete';
import { SelectField } from '@/components/SelectField';
import { ImageGallery } from '@/features/images/ImageGallery';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import { DialogueCard } from './DialogueCard';
import styles from './ShotCard.module.css';
import { createDialogueLine, listDialogue } from './dialogueRepository';
import { deleteShot, saveShotField, type ShotField } from './shotsRepository';
import { SHOT_TYPES, type Shot } from './types';

/**
 * One shot: the single image this moment of the scene should generate, its
 * reference pictures, and the lines said over it.
 */
export function ShotCard({ shot }: { shot: Shot }) {
  const dialogue = useLiveQuery(async () => listDialogue(shot.id), [shot.id]);

  function save(field: ShotField, value: string) {
    void saveShotField(shot.id, field, value).then(() => {
      requestSync(EDIT_SYNC_DELAY_MS);
    });
  }

  function addLine() {
    void createDialogueLine(shot.worldId, shot.id).then(() => {
      requestSync();
    });
  }

  const lines = dialogue ?? [];

  return (
    <li className={styles.card}>
      <span className={styles.number}>Shot {shot.number}</span>

      <div className={styles.fields}>
        <SelectField
          label="Shot type"
          value={shot.shotType}
          options={SHOT_TYPES}
          onChange={(value) => {
            save('shotType', value);
          }}
        />
        <AutosaveField
          label="Camera — leave empty if static"
          value={shot.camera}
          onSave={(value) => {
            save('camera', value);
          }}
        />
      </div>

      <AutosaveField
        label="Visual — one clear moment"
        value={shot.visual}
        multiline
        onSave={(value) => {
          save('visual', value);
        }}
      />

      <ImageGallery worldId={shot.worldId} ownerId={shot.id} label="Images" />

      <div className={styles.dialogue}>
        <span className={styles.dialogueLabel}>
          Dialogue
          {lines.length > 0 && <span className={styles.count}> · {lines.length}</span>}
        </span>
        {lines.length > 0 && (
          <ol className={styles.lines}>
            {lines.map((line) => (
              <DialogueCard key={line.id} line={line} />
            ))}
          </ol>
        )}
        <button type="button" className={styles.add} onClick={addLine}>
          + Add line
        </button>
      </div>

      <HoldToDelete
        className={styles.delete}
        label={`Delete shot ${String(shot.number)}`}
        onDelete={() => {
          void deleteShot(shot.id).then(() => {
            requestSync(EDIT_SYNC_DELAY_MS);
          });
        }}
      >
        ×
      </HoldToDelete>
    </li>
  );
}
