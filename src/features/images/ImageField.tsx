import { useLiveQuery } from 'dexie-react-hooks';
import { useRef } from 'react';

import { HoldToDelete } from '@/components/HoldToDelete';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './ImageField.module.css';
import { deleteOwnerImages, getOwnerImage, setOwnerImage } from './imagesRepository';
import { useAddImages } from './useAddImages';
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
 * hold to remove it. A shot keeps several instead — see `ImageGallery`.
 */
export function ImageField({ worldId, ownerId, label }: ImageFieldProps) {
  const image = useLiveQuery(async () => getOwnerImage(ownerId), [ownerId]);
  const url = useImageUrl(image?.blob ?? null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { take, isWorking, error } = useAddImages(async (blob) =>
    setOwnerImage(worldId, ownerId, blob),
  );

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
          take(event.target);
        }}
      />

      {error !== null && <p className={styles.error}>{error}</p>}
    </div>
  );
}
