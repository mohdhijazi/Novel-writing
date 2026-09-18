import {
  createJsonFile,
  downloadJsonFile,
  findJsonFile,
  updateJsonFile,
} from '@/lib/google/driveApi';
import { SCHEMA_VERSION, fileNameFor, type CollectionFile } from '@/lib/storage/collectionFile';

import { listCharacterRecords, mergeRemoteCharacters } from './charactersRepository';
import { toCharacterDoc } from './types';
import type { Character, CharacterDoc } from './types';

const FILE_NAME = fileNameFor('characters');

function toFile(characters: Character[]): CollectionFile<CharacterDoc> {
  return {
    schemaVersion: SCHEMA_VERSION,
    collection: 'characters',
    updatedAt: new Date().toISOString(),
    records: characters.map(toCharacterDoc),
  };
}

/**
 * Merges one world's characters with `characters.json` in its Drive folder.
 * The file is small, so it is read on every pass rather than tracked for
 * changes, and written back only when this device holds something newer.
 */
export async function syncCharactersForWorld(
  worldId: string,
  worldFolderId: string,
): Promise<void> {
  const file = await findJsonFile(FILE_NAME, worldFolderId);
  const local = await listCharacterRecords(worldId);

  if (!file) {
    if (local.length > 0) {
      await createJsonFile(FILE_NAME, worldFolderId, toFile(local));
    }
    return;
  }

  const content = await downloadJsonFile<CollectionFile<CharacterDoc>>(file.id);
  const localIsAhead = await mergeRemoteCharacters(worldId, content.records);
  if (!localIsAhead) {
    return;
  }

  const merged = await listCharacterRecords(worldId);
  await updateJsonFile(file.id, toFile(merged));
}
