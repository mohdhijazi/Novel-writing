import { syncCollectionForWorld, type CollectionSync } from '@/features/sync/syncCollection';

import { listCharacterRecords, mergeRemoteCharacters } from './charactersRepository';
import { toCharacterDoc } from './types';
import type { Character, CharacterDoc } from './types';

const characterSync: CollectionSync<Character, CharacterDoc> = {
  collection: 'characters',
  listRecords: listCharacterRecords,
  mergeRemote: mergeRemoteCharacters,
  toDoc: toCharacterDoc,
};

export async function syncCharactersForWorld(
  worldId: string,
  worldFolderId: string,
): Promise<void> {
  await syncCollectionForWorld(characterSync, worldId, worldFolderId);
}
