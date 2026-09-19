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
  /** Drive file holding this chapter's paragraphs; null until it is synced. */
  driveParagraphsFileId: string | null;
  /** Drive's timestamp for that file when it was last merged, to skip re-downloads. */
  driveParagraphsModifiedTime: string | null;
  /**
   * Counts local paragraph writes. Compared with `paragraphsSyncedRevision` to
   * know whether this device has anything to upload — a counter rather than a
   * timestamp, so a clock that is ahead on one device cannot hide an edit.
   */
  paragraphsRevision: number;
  /** Value of `paragraphsRevision` at the last successful upload. */
  paragraphsSyncedRevision: number;
}

export interface Paragraph extends StoredRecord {
  chapterId: string;
  /** Sort key within the chapter. Gaps are allowed. */
  order: number;
  text: string;
  createdAt: string;
}

/** `novel.json` in the novel's Drive folder. */
export interface NovelDoc {
  schemaVersion: number;
  id: string;
  worldId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** `chapter.json` in the chapter's Drive folder. */
export interface ChapterDoc {
  schemaVersion: number;
  id: string;
  novelId: string;
  number: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ParagraphDoc {
  id: string;
  order: number;
  text: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** `paragraphs.json` in the chapter's Drive folder. */
export interface ParagraphsFile {
  schemaVersion: number;
  chapterId: string;
  updatedAt: string;
  paragraphs: ParagraphDoc[];
}
