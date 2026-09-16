import type { StoredRecord } from '@/lib/storage/collectionFile';

/** A novel set in a world. Its Drive folder holds one folder per chapter. */
export interface Novel extends StoredRecord {
  worldId: string;
  title: string;
  createdAt: string;
  /** Drive folder for this novel; null until it is synced. */
  driveFolderId: string | null;
}

export interface Chapter extends StoredRecord {
  novelId: string;
  /** Position in the novel, shown next to the title. */
  number: number;
  title: string;
  createdAt: string;
  /** Drive folder for this chapter; null until it is synced. */
  driveFolderId: string | null;
}

export interface Paragraph extends StoredRecord {
  chapterId: string;
  /** Sort key within the chapter. Gaps are allowed. */
  order: number;
  text: string;
  createdAt: string;
}
