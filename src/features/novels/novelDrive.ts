import {
  createFolder,
  createJsonFile,
  downloadJsonFile,
  findFolder,
  findJsonFile,
  listSubfolders,
  updateJsonFile,
} from '@/lib/google/driveApi';
import {
  COLLECTION_NAMES,
  SCHEMA_VERSION,
  createEmptyCollectionFile,
  fileNameFor,
} from '@/lib/storage/collectionFile';

import type { Novel, NovelDoc } from './types';

/** Top-level folder in the user's Drive; one subfolder per novel. */
const ROOT_FOLDER_NAME = 'Novel Writing';
const NOVEL_DOC_NAME = 'novel.json';

/** Characters Drive does not allow in file names. */
const INVALID_NAME_CHARACTERS = /[\\/:*?"<>|]/g;

function folderNameFor(novel: Novel): string {
  const name = novel.title.replace(INVALID_NAME_CHARACTERS, ' ').trim();
  return name || 'Untitled novel';
}

function toNovelDoc(novel: Novel): NovelDoc {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: novel.id,
    title: novel.title,
    createdAt: novel.createdAt,
    updatedAt: novel.updatedAt,
    deletedAt: novel.deletedAt,
  };
}

export async function ensureRootFolder(): Promise<string> {
  const existing = await findFolder(ROOT_FOLDER_NAME);
  const folder = existing ?? (await createFolder(ROOT_FOLDER_NAME));
  return folder.id;
}

/**
 * Creates the novel's folder with `novel.json` and one empty file per
 * collection. Returns the new folder's id.
 */
export async function createNovelFolder(rootFolderId: string, novel: Novel): Promise<string> {
  const folder = await createFolder(folderNameFor(novel), rootFolderId);
  await createJsonFile(NOVEL_DOC_NAME, folder.id, toNovelDoc(novel));
  for (const collection of COLLECTION_NAMES) {
    await createJsonFile(fileNameFor(collection), folder.id, createEmptyCollectionFile(collection));
  }
  return folder.id;
}

export async function writeNovelDoc(novel: Novel, driveFolderId: string): Promise<void> {
  const file = await findJsonFile(NOVEL_DOC_NAME, driveFolderId);
  if (file) {
    await updateJsonFile(file.id, toNovelDoc(novel));
    return;
  }
  await createJsonFile(NOVEL_DOC_NAME, driveFolderId, toNovelDoc(novel));
}

export interface RemoteNovel {
  doc: NovelDoc;
  driveFolderId: string;
}

/** Reads every novel folder under the root folder. */
export async function listRemoteNovels(rootFolderId: string): Promise<RemoteNovel[]> {
  const folders = await listSubfolders(rootFolderId);
  const novels: RemoteNovel[] = [];
  for (const folder of folders) {
    const file = await findJsonFile(NOVEL_DOC_NAME, folder.id);
    if (!file) {
      continue;
    }
    const doc = await downloadJsonFile<NovelDoc>(file.id);
    novels.push({ doc, driveFolderId: folder.id });
  }
  return novels;
}
