import { deleteOwnerImages } from '@/features/images/imagesRepository';
import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import { normalizeCharacter } from './types';
import type { Character, CharacterDoc, CharacterTextField } from './types';

export async function listCharacters(worldId: string): Promise<Character[]> {
  const characters = await listCharacterRecords(worldId);
  return characters
    .filter((character) => character.deletedAt === null)
    .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
}

/**
 * Every character of a world, deleted ones included — sync needs the tombstones.
 * Records are normalized on the way out, so fields added after they were saved
 * read as empty instead of undefined.
 */
export async function listCharacterRecords(worldId: string): Promise<Character[]> {
  const characters = await db.characters.where('worldId').equals(worldId).toArray();
  return characters.map(normalizeCharacter);
}

export async function createCharacter(
  worldId: string,
  firstName: string,
  lastName: string,
): Promise<Character> {
  const timestamp = new Date().toISOString();
  const character = normalizeCharacter({
    id: crypto.randomUUID(),
    worldId,
    firstName,
    lastName,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  } as Character);
  await db.characters.add(character);
  return character;
}

/** Adds characters from an import file, filling in whatever fields it carried. */
export async function addImportedCharacters(
  worldId: string,
  imported: Record<string, string>[],
): Promise<void> {
  const timestamp = new Date().toISOString();
  const characters = imported.map((fields) =>
    normalizeCharacter({
      ...fields,
      id: crypto.randomUUID(),
      worldId,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    } as Character),
  );
  await db.characters.bulkAdd(characters);
}

export async function saveCharacterField(
  id: string,
  field: CharacterTextField,
  value: string,
): Promise<void> {
  await db.characters.update(id, { [field]: value, updatedAt: new Date().toISOString() });
}

export async function deleteCharacter(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.characters.update(id, { deletedAt: timestamp, updatedAt: timestamp });
  // Their picture goes too, so its file does not stay behind in Drive.
  await deleteOwnerImages(id);
}

/** Applies the characters from Drive; returns whether the local side holds more. */
export async function mergeRemoteCharacters(
  worldId: string,
  docs: CharacterDoc[],
): Promise<boolean> {
  const local = await listCharacterRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) =>
    normalizeCharacter({ ...doc, worldId }),
  );
  if (toStore.length > 0) {
    await db.characters.bulkPut(toStore);
  }
  return localIsAhead;
}
