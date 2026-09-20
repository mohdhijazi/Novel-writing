import { syncCollectionForWorld, type CollectionSync } from '@/features/sync/syncCollection';
import {
  createBinaryFile,
  createFolder,
  downloadFileBlob,
  findFolder,
  trashFile,
} from '@/lib/google/driveApi';

import {
  attachDriveFile,
  forgetTrashedImage,
  listImageRecords,
  listImagesToDownload,
  listImagesToTrash,
  listImagesToUpload,
  mergeRemoteImages,
  storeImageBytes,
} from './imagesRepository';
import { toImageDoc } from './types';
import type { WorldImage, WorldImageDoc } from './types';

/** Folder inside a world's folder holding its pictures, one file each. */
const IMAGES_FOLDER_NAME = 'Images';

const imageSync: CollectionSync<WorldImage, WorldImageDoc> = {
  collection: 'images',
  listRecords: listImageRecords,
  mergeRemote: mergeRemoteImages,
  toDoc: toImageDoc,
};

/**
 * Pictures sync in two parts: the bytes as whole files in the world's Images
 * folder, and `images.json` saying which file belongs to which character or
 * location. Bytes go up first, so the records uploaded straight after already
 * point at their file; they come down last, once the records are known.
 */
export async function syncImagesForWorld(worldId: string, worldFolderId: string): Promise<void> {
  await pushImageFiles(worldId, worldFolderId);
  await syncCollectionForWorld(imageSync, worldId, worldFolderId);
  await pullImageFiles(worldId);
}

/** Found or made only when there is a picture to put in it. */
async function ensureImagesFolder(worldFolderId: string): Promise<string> {
  const existing = await findFolder(IMAGES_FOLDER_NAME, worldFolderId);
  const folder = existing ?? (await createFolder(IMAGES_FOLDER_NAME, worldFolderId));
  return folder.id;
}

async function pushImageFiles(worldId: string, worldFolderId: string): Promise<void> {
  for (const image of await listImagesToTrash(worldId)) {
    await trashFile(image.driveFileId);
    await forgetTrashedImage(image.id);
  }

  const uploads = await listImagesToUpload(worldId);
  if (uploads.length === 0) {
    return;
  }
  const folderId = await ensureImagesFolder(worldFolderId);
  for (const upload of uploads) {
    const file = await createBinaryFile(upload.name, folderId, upload.blob);
    await attachDriveFile(upload.id, file.id);
  }
}

async function pullImageFiles(worldId: string): Promise<void> {
  for (const image of await listImagesToDownload(worldId)) {
    await storeImageBytes(image.id, await downloadFileBlob(image.driveFileId));
  }
}
