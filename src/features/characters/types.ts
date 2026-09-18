import type { StoredRecord } from '@/lib/storage/collectionFile';

/** A character in a world. More fields (roles, notes, links) come later. */
export interface Character extends StoredRecord {
  worldId: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

/** A character as stored in `characters.json`; the world is the folder it sits in. */
export type CharacterDoc = Omit<Character, 'worldId'>;

export function characterFullName(character: Character): string {
  return `${character.firstName} ${character.lastName}`.trim();
}
