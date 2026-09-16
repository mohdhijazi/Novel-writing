import type { StoredRecord } from '@/lib/storage/collectionFile';

/** A novel as stored locally in IndexedDB. */
export interface Novel extends StoredRecord {
  title: string;
  createdAt: string;
  /** Drive folder holding this novel's JSON files; null until it is synced. */
  driveFolderId: string | null;
}

/** `novel.json` inside the novel's Drive folder — how other devices discover it. */
export interface NovelDoc {
  schemaVersion: number;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
