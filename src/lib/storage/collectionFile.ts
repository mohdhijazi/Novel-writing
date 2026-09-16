/**
 * Shape of the JSON files stored in a novel's Drive folder. One file holds all
 * records of one kind; syncing merges record by record using `updatedAt`.
 */
export const SCHEMA_VERSION = 1;

export const COLLECTION_NAMES = ['characters', 'locations', 'events', 'chapters', 'links'] as const;

export type CollectionName = (typeof COLLECTION_NAMES)[number];

export interface StoredRecord {
  id: string;
  updatedAt: string;
  /** Soft delete: kept so the other device does not restore the record. */
  deletedAt: string | null;
}

export interface CollectionFile<TRecord extends StoredRecord = StoredRecord> {
  schemaVersion: number;
  collection: CollectionName;
  updatedAt: string;
  records: TRecord[];
}

export function fileNameFor(collection: CollectionName): string {
  return `${collection}.json`;
}

export function createEmptyCollectionFile(collection: CollectionName): CollectionFile {
  return {
    schemaVersion: SCHEMA_VERSION,
    collection,
    updatedAt: new Date().toISOString(),
    records: [],
  };
}
