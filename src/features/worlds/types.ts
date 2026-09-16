import type { StoredRecord } from '@/lib/storage/collectionFile';

/** A world as stored locally in IndexedDB. */
export interface World extends StoredRecord {
  name: string;
  createdAt: string;
  /** Drive folder holding this world's JSON files; null until it is synced. */
  driveFolderId: string | null;
}

/** `world.json` inside the world's Drive folder — how other devices discover it. */
export interface WorldDoc {
  schemaVersion: number;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
