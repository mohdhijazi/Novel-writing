import { HoldToDelete } from '@/components/HoldToDelete';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './GalleryImage.module.css';
import { deleteImage } from './imagesRepository';
import { useImageUrl } from './useImageUrl';
import type { WorldImage } from './types';

interface GalleryImageProps {
  image: WorldImage;
  /** Its place in the gallery, so each one can be named apart from the rest. */
  position: number;
  /** What the gallery holds, e.g. "Images". */
  label: string;
}

/** One picture in a gallery, with its own hold-to-remove button. */
export function GalleryImage({ image, position, label }: GalleryImageProps) {
  const url = useImageUrl(image.blob);

  return (
    <li className={styles.item}>
      {url === null ? (
        <p className={styles.note}>Not on this device yet — sync to fetch it.</p>
      ) : (
        <img className={styles.thumbnail} src={url} alt={`${label} ${String(position)}`} />
      )}
      <HoldToDelete
        className={styles.remove}
        label={`Remove ${label.toLowerCase()} ${String(position)}`}
        onDelete={() => {
          void deleteImage(image.id).then(() => {
            requestSync(EDIT_SYNC_DELAY_MS);
          });
        }}
      >
        ×
      </HoldToDelete>
    </li>
  );
}
