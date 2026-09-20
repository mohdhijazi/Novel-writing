import { IMAGE_EXTENSION } from '@/lib/images/prepareImage';
import type { StoredRecord } from '@/lib/storage/collectionFile';

/**
 * A picture belonging to one character or location.
 *
 * The bytes are kept out of the record that owns them: they are binary, while
 * every other file in a world is JSON, and they never change once written — a
 * new picture is a new record and a new file in Drive. That leaves nothing to
 * merge, so the only thing two devices can disagree about is which picture is
 * the current one, which `updatedAt` settles like any other record.
 */
export interface WorldImage extends StoredRecord {
  worldId: string;
  /** The character or location this belongs to; ids are unique across both. */
  ownerId: string;
  /** Drive's id for the bytes, or null while they are only on this device. */
  driveFileId: string | null;
  /**
   * The picture itself. Null on a device that has not fetched it yet, and on
   * one that has removed it. Stays on the device — the copy in Drive is the
   * file `driveFileId` points at.
   */
  blob: Blob | null;
  createdAt: string;
}

/** An image as stored in `images.json`: everything but the bytes. */
export type WorldImageDoc = Omit<WorldImage, 'worldId' | 'blob'>;

export function toImageDoc(image: WorldImage): WorldImageDoc {
  return {
    id: image.id,
    ownerId: image.ownerId,
    driveFileId: image.driveFileId,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
    deletedAt: image.deletedAt,
  };
}

/** Its file name inside the world's Images folder. */
export function imageFileName(image: WorldImage): string {
  return `${image.id}.${IMAGE_EXTENSION}`;
}
