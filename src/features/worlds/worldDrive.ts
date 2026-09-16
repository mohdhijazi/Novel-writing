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

import type { World, WorldDoc } from './types';

/** Top-level folder in the user's Drive; one subfolder per world. */
const ROOT_FOLDER_NAME = 'Worlds';
const WORLD_DOC_NAME = 'world.json';

/** Characters Drive does not allow in file names. */
const INVALID_NAME_CHARACTERS = /[\\/:*?"<>|]/g;

function folderNameFor(world: World): string {
  const name = world.name.replace(INVALID_NAME_CHARACTERS, ' ').trim();
  return name || 'Untitled world';
}

function toWorldDoc(world: World): WorldDoc {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: world.id,
    name: world.name,
    createdAt: world.createdAt,
    updatedAt: world.updatedAt,
    deletedAt: world.deletedAt,
  };
}

export async function ensureRootFolder(): Promise<string> {
  const existing = await findFolder(ROOT_FOLDER_NAME);
  const folder = existing ?? (await createFolder(ROOT_FOLDER_NAME));
  return folder.id;
}

/**
 * Creates the world's folder with `world.json` and one empty file per
 * collection. Returns the new folder's id.
 */
export async function createWorldFolder(rootFolderId: string, world: World): Promise<string> {
  const folder = await createFolder(folderNameFor(world), rootFolderId);
  await createJsonFile(WORLD_DOC_NAME, folder.id, toWorldDoc(world));
  for (const collection of COLLECTION_NAMES) {
    await createJsonFile(fileNameFor(collection), folder.id, createEmptyCollectionFile(collection));
  }
  return folder.id;
}

export async function writeWorldDoc(world: World, driveFolderId: string): Promise<void> {
  const file = await findJsonFile(WORLD_DOC_NAME, driveFolderId);
  if (file) {
    await updateJsonFile(file.id, toWorldDoc(world));
    return;
  }
  await createJsonFile(WORLD_DOC_NAME, driveFolderId, toWorldDoc(world));
}

export interface RemoteWorld {
  doc: WorldDoc;
  driveFolderId: string;
}

/** Reads every world folder under the root folder. */
export async function listRemoteWorlds(rootFolderId: string): Promise<RemoteWorld[]> {
  const folders = await listSubfolders(rootFolderId);
  const worlds: RemoteWorld[] = [];
  for (const folder of folders) {
    const file = await findJsonFile(WORLD_DOC_NAME, folder.id);
    if (!file) {
      continue;
    }
    const doc = await downloadJsonFile<WorldDoc>(file.id);
    worlds.push({ doc, driveFolderId: folder.id });
  }
  return worlds;
}
