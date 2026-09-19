import type { StoredRecord } from '@/lib/storage/collectionFile';

/**
 * A character in a world. Every detail field is free text — the point is to
 * capture thinking, not to enforce a shape.
 */
export interface Character extends StoredRecord {
  worldId: string;
  createdAt: string;

  // Identity & basics
  firstName: string;
  lastName: string;
  nicknames: string;
  age: string;
  occupation: string;
  socialClass: string;

  // Physical
  distinguishingFeatures: string;
  mannerisms: string;

  // Psychology
  coreWant: string;
  coreNeed: string;
  greatestFear: string;
  definingFlaw: string;
  moralCode: string;

  // Voice
  speechPattern: string;

  // Background
  formativeEvents: string;
  pastRelationships: string;

  // Relationships (present-tense)
  trustAndDistrust: string;
  powerDynamics: string;

  // Story function
  role: string;
  arcStart: string;
  arcEnd: string;
  arcChange: string;

  // Secrets
  secretsFromOthers: string;
  secretsFromSelf: string;
}

/** A character as stored in `characters.json`; the world is the folder it sits in. */
export type CharacterDoc = Omit<Character, 'worldId'>;

/** The free-text detail fields, i.e. everything except the record's own plumbing. */
export type CharacterTextField = Exclude<
  keyof Character,
  'id' | 'worldId' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

const EMPTY_TEXT_FIELDS: Record<CharacterTextField, string> = {
  firstName: '',
  lastName: '',
  nicknames: '',
  age: '',
  occupation: '',
  socialClass: '',
  distinguishingFeatures: '',
  mannerisms: '',
  coreWant: '',
  coreNeed: '',
  greatestFear: '',
  definingFlaw: '',
  moralCode: '',
  speechPattern: '',
  formativeEvents: '',
  pastRelationships: '',
  trustAndDistrust: '',
  powerDynamics: '',
  role: '',
  arcStart: '',
  arcEnd: '',
  arcChange: '',
  secretsFromOthers: '',
  secretsFromSelf: '',
};

export const CHARACTER_TEXT_FIELDS = Object.keys(EMPTY_TEXT_FIELDS) as CharacterTextField[];

/** The record as it is stored in Drive: everything but the world it belongs to. */
export function toCharacterDoc(character: Character): CharacterDoc {
  const text = Object.fromEntries(
    CHARACTER_TEXT_FIELDS.map((field) => [field, character[field]]),
  ) as Record<CharacterTextField, string>;
  return {
    id: character.id,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
    deletedAt: character.deletedAt,
    ...text,
  };
}

/**
 * Fills in fields a character record does not have yet. Characters saved before
 * a field existed — locally or in someone's Drive — must keep loading, so every
 * read goes through this.
 */
export function normalizeCharacter(record: Character): Character {
  return { ...EMPTY_TEXT_FIELDS, ...record };
}

export function characterFullName(character: Character): string {
  return `${character.firstName} ${character.lastName}`.trim();
}
