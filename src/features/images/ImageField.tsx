import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';

import { HoldToDelete } from '@/components/HoldToDelete';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';
import { ImageRejected, prepareImage } from '@/lib/images/prepareImage';

import styles from './ImageField.module.css';
import { deleteOwnerImages, getOwnerImage, setOwnerImage } from './imagesRepository';
import { useImageUrl } from './useImageUrl';

interface ImageFieldProps {
  worldId: string;
  /** The character or location the picture belongs to. */
  ownerId: string;
  /** What the picture is of, e.g. "Portrait". */
  label: string;
}

/**
 * The one picture a character or location can have: choose it, replace it, or
 * hold to remove it. Shared by both features — the record, the file in Drive
 * and the button all live here.
 */
export function ImageField({ worldId, ownerId, label }: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const image = useLiveQuery(async () => getOwnerImage(ownerId), [ownerId]);
  const url = useImageUrl(image?.blob ?? null);

  function choose(file: File | undefined) {
    if (file === undefined) {
      return;
    }
    setIsWorking(true);
    setError(null);
    void prepareImage(file)
      .then(async (blob) => setOwnerImage(worldId, ownerId, blob))
      .then(() => {
        setIsWorking(false);
        requestSync(EDIT_SYNC_DELAY_MS);
      })
      .catch((cause: unknown) => {
        setIsWorking(false);
        setError(
          cause instanceof ImageRejected ? cause.message : 'That picture could not be saved.',
        );
      });
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>

      {url !== null && <img className={styles.preview} src={url} alt={label} />}
      {url === null && image != null && (
        <p className={styles.note}>Not on this device yet — sync to fetch it.</p>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.choose}
          disabled={isWorking}
          onClick={() => {
            inputRef.current?.click();
          }}
        >
          {isWorking ? 'Adding…' : image == null ? 'Add a picture' : 'Replace picture'}
        </button>
        {image != null && (
          <HoldToDelete
            className={styles.remove}
            label={`Remove ${label.toLowerCase()}`}
            onDelete={() => {
              void deleteOwnerImages(ownerId).then(() => {
                requestSync(EDIT_SYNC_DELAY_MS);
              });
            }}
          >
            Remove
          </HoldToDelete>
        )}
      </div>

      <input
        ref={inputRef}
        className={styles.input}
        type="file"
        accept="image/*"
        aria-label={`Choose a picture — ${label}`}
        onChange={(event) => {
          choose(event.target.files?.[0]);
          // Cleared so choosing the same file again still counts as a change.
          event.target.value = '';
        }}
      />

      {error !== null && <p className={styles.error}>{error}</p>}
    </div>
  );
}
