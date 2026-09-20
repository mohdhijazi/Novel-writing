import { useLiveQuery } from 'dexie-react-hooks';
import { useRef } from 'react';

import { GalleryImage } from './GalleryImage';
import styles from './ImageGallery.module.css';
import { addOwnerImage, listOwnerImages } from './imagesRepository';
import { useAddImages } from './useAddImages';

interface ImageGalleryProps {
  worldId: string;
  /** What the pictures belong to — a shot. */
  ownerId: string;
  /** What the pictures are, e.g. "Images". */
  label: string;
}

/**
 * As many pictures as the owner needs, added in one go or a few at a time.
 * Characters and locations keep a single picture instead — see `ImageField`.
 */
export function ImageGallery({ worldId, ownerId, label }: ImageGalleryProps) {
  const images = useLiveQuery(async () => listOwnerImages(ownerId), [ownerId]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { take, isWorking, error } = useAddImages(async (blob) =>
    addOwnerImage(worldId, ownerId, blob),
  );
  const list = images ?? [];

  return (
    <div className={styles.gallery}>
      <span className={styles.label}>
        {label}
        {list.length > 0 && <span className={styles.count}> · {list.length}</span>}
      </span>

      {list.length > 0 && (
        <ul className={styles.grid}>
          {list.map((image, index) => (
            <GalleryImage key={image.id} image={image} position={index + 1} label={label} />
          ))}
        </ul>
      )}

      <button
        type="button"
        className={styles.choose}
        disabled={isWorking}
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        {isWorking ? 'Adding…' : '+ Add pictures'}
      </button>

      <input
        ref={inputRef}
        className={styles.input}
        type="file"
        accept="image/*"
        multiple
        aria-label={`Choose pictures — ${label}`}
        onChange={(event) => {
          take(event.target);
        }}
      />

      {error !== null && <p className={styles.error}>{error}</p>}
    </div>
  );
}
