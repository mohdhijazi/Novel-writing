/**
 * Shape of the JSON files stored in a world's Drive folder. One file holds all
 * records of one kind; syncing merges record by record using `updatedAt`.
 *
 * Novels are not here: they are folders of their own inside the world's folder,
 * because a novel holds chapter folders rather than a flat list of records.
 */
export const SCHEMA_VERSION = 1;

export const COLLECTION_NAMES = [
  'characters',
  'locations',
  'connections',
  'calendar',
  'events',
  'ideas',
  'relations',
  'tickets',
  'ticketLinks',
] as const;

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
