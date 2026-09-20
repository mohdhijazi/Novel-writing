import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import { imageFileName } from './types';
import type { WorldImage, WorldImageDoc } from './types';

/** Every image of a world, removed ones included — sync needs the tombstones. */
export async function listImageRecords(worldId: string): Promise<WorldImage[]> {
  return db.images.where('worldId').equals(worldId).toArray();
}

/**
 * The picture to show for a character or location: the newest one still there.
 * Two devices adding a picture while apart leave two records; the newer one is
 * shown, and the older goes the next time the picture is replaced.
 */
export async function getOwnerImage(ownerId: string): Promise<WorldImage | null> {
  const images = await db.images.where('ownerId').equals(ownerId).toArray();
  return (
    images
      .filter((image) => image.deletedAt === null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
  );
}

/** Every picture of an owner, oldest first — a beat keeps as many as it needs. */
export async function listOwnerImages(ownerId: string): Promise<WorldImage[]> {
  const images = await db.images.where('ownerId').equals(ownerId).toArray();
  return images
    .filter((image) => image.deletedAt === null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function newImage(worldId: string, ownerId: string, blob: Blob, timestamp: string): WorldImage {
  return {
    id: crypto.randomUUID(),
    worldId,
    ownerId,
    driveFileId: null,
    blob,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
}

/** Gives the owner a picture, replacing whichever it had. */
export async function setOwnerImage(
  worldId: string,
  ownerId: string,
  blob: Blob,
): Promise<WorldImage> {
  const timestamp = new Date().toISOString();
  const image = newImage(worldId, ownerId, blob, timestamp);
  // One transaction, so a picture is never both replaced and lost.
  await db.transaction('rw', db.images, async () => {
    await removeOwnerImages(ownerId, timestamp);
    await db.images.add(image);
  });
  return image;
}

/** Adds a picture alongside the ones the owner already has. */
export async function addOwnerImage(
  worldId: string,
  ownerId: string,
  blob: Blob,
): Promise<WorldImage> {
  const image = newImage(worldId, ownerId, blob, new Date().toISOString());
  await db.images.add(image);
  return image;
}

/** Takes one picture away, leaving the owner's others alone. */
export async function deleteImage(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  // The bytes go now; the record stays until sync bins the Drive file.
  await db.images.update(id, { deletedAt: timestamp, updatedAt: timestamp, blob: null });
}

/**
 * Removes every picture of an owner — called when a single picture is taken
 * away, and when the character, location or beat itself is deleted, so its
 * bytes do not stay behind in Drive.
 */
export async function deleteOwnerImages(ownerId: string): Promise<void> {
  await removeOwnerImages(ownerId, new Date().toISOString());
}

async function removeOwnerImages(ownerId: string, timestamp: string): Promise<void> {
  const images = await db.images.where('ownerId').equals(ownerId).toArray();
  for (const image of images) {
    if (image.deletedAt === null) {
      // The bytes go now; the record stays until sync bins the Drive file.
      await db.images.update(image.id, { deletedAt: timestamp, updatedAt: timestamp, blob: null });
    }
  }
}

/** A picture waiting to be uploaded, with the name its file will take. */
export interface ImageUpload {
  id: string;
  name: string;
  blob: Blob;
}

/** A picture whose bytes are a file in Drive. */
export interface ImageFileRef {
  id: string;
  driveFileId: string;
}

/** Pictures taken on this device that Drive has never seen. */
export async function listImagesToUpload(worldId: string): Promise<ImageUpload[]> {
  const images = await listImageRecords(worldId);
  return images.flatMap((image) =>
    image.deletedAt === null && image.blob !== null && image.driveFileId === null
      ? [{ id: image.id, name: imageFileName(image), blob: image.blob }]
      : [],
  );
}

/** Pictures removed here whose file is still in Drive. */
export async function listImagesToTrash(worldId: string): Promise<ImageFileRef[]> {
  const images = await listImageRecords(worldId);
  return images.flatMap((image) =>
    image.deletedAt !== null && image.driveFileId !== null
      ? [{ id: image.id, driveFileId: image.driveFileId }]
      : [],
  );
}

/** Pictures this device knows of but has never fetched the bytes for. */
export async function listImagesToDownload(worldId: string): Promise<ImageFileRef[]> {
  const images = await listImageRecords(worldId);
  return images.flatMap((image) =>
    image.deletedAt === null && image.driveFileId !== null && image.blob === null
      ? [{ id: image.id, driveFileId: image.driveFileId }]
      : [],
  );
}

/** Records where the bytes landed in Drive, so the other device can fetch them. */
export async function attachDriveFile(id: string, driveFileId: string): Promise<void> {
  await db.images.update(id, { driveFileId, updatedAt: new Date().toISOString() });
}

/**
 * Stores bytes fetched from Drive. `updatedAt` is left alone: the record itself
 * did not change, and bumping it would send an unchanged file back to Drive.
 */
export async function storeImageBytes(id: string, blob: Blob): Promise<void> {
  await db.images.update(id, { blob });
}

/** Forgets a binned file, so it is only binned once. */
export async function forgetTrashedImage(id: string): Promise<void> {
  await db.images.update(id, { driveFileId: null, updatedAt: new Date().toISOString() });
}

/** Applies the images from Drive; returns whether the local side holds more. */
export async function mergeRemoteImages(worldId: string, docs: WorldImageDoc[]): Promise<boolean> {
  const local = await listImageRecords(worldId);
  const localById = new Map(local.map((image) => [image.id, image]));
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) => ({
    ...doc,
    worldId,
    // Bytes are not in the file, so keep the ones this device already has.
    blob: doc.deletedAt === null ? (localById.get(doc.id)?.blob ?? null) : null,
  }));
  if (toStore.length > 0) {
    await db.images.bulkPut(toStore);
  }
  return localIsAhead;
}
