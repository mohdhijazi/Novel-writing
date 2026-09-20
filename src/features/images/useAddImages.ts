import { useState } from 'react';

import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';
import { ImageRejected, prepareImage } from '@/lib/images/prepareImage';

interface AddImages {
  /** Hand it the file input that changed; it clears the input itself. */
  take: (input: HTMLInputElement) => void;
  isWorking: boolean;
  error: string | null;
}

/**
 * Picking, scaling and storing pictures — the part the single picture field and
 * the gallery do the same way. `store` decides what a picture becomes: the
 * owner's one picture, or another of many.
 */
export function useAddImages(store: (blob: Blob) => Promise<unknown>): AddImages {
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function take(input: HTMLInputElement) {
    const files = [...(input.files ?? [])];
    // Cleared so choosing the same file again still counts as a change.
    input.value = '';
    if (files.length === 0) {
      return;
    }
    setIsWorking(true);
    setError(null);
    void (async () => {
      try {
        // One at a time: several full-size photos decoded at once can exhaust
        // the memory a tab is given, on an iPad especially.
        for (const file of files) {
          await store(await prepareImage(file));
        }
        requestSync(EDIT_SYNC_DELAY_MS);
      } catch (cause) {
        setError(
          cause instanceof ImageRejected ? cause.message : 'That picture could not be saved.',
        );
      } finally {
        setIsWorking(false);
      }
    })();
  }

  return { take, isWorking, error };
}
