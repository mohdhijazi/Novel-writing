import { db } from '@/lib/db/database';

import type { Character, CharacterDoc } from './types';

export async function listCharacters(worldId: string): Promise<Character[]> {
  const characters = await listCharacterRecords(worldId);
  return characters
    .filter((character) => character.deletedAt === null)
    .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
}

/** Every character of a world, deleted ones included — sync needs the tombstones. */
export async function listCharacterRecords(worldId: string): Promise<Character[]> {
  return db.characters.where('worldId').equals(worldId).toArray();
}

export async function createCharacter(
  worldId: string,
  firstName: string,
  lastName: string,
): Promise<Character> {
  const timestamp = new Date().toISOString();
  const character: Character = {
    id: crypto.randomUUID(),
    worldId,
    firstName,
    lastName,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  await db.characters.add(character);
  return character;
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
    toStore.push({ ...doc, worldId });
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
