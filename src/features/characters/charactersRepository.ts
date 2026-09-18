import { db } from '@/lib/db/database';

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
}

/**
 * Merges the characters from Drive into the local ones, newest `updatedAt`
 * winning per character. Returns true when the local side holds something the
 * Drive copy does not, meaning the merged file has to be uploaded.
 */
export async function mergeRemoteCharacters(
  worldId: string,
  docs: CharacterDoc[],
): Promise<boolean> {
  const local = await listCharacterRecords(worldId);
  const localById = new Map(local.map((character) => [character.id, character]));
  const toStore: Character[] = [];
  let localIsAhead = false;

  for (const doc of docs) {
    const existing = localById.get(doc.id);
    if (existing && existing.updatedAt >= doc.updatedAt) {
      if (existing.updatedAt > doc.updatedAt) {
        localIsAhead = true;
      }
      continue;
    }
    toStore.push(normalizeCharacter({ ...doc, worldId }));
  }

  const remoteIds = new Set(docs.map((doc) => doc.id));
  if (local.some((character) => !remoteIds.has(character.id))) {
    localIsAhead = true;
  }

  if (toStore.length > 0) {
    await db.characters.bulkPut(toStore);
  }
  return localIsAhead;
}
