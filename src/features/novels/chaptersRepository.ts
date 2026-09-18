import { db } from '@/lib/db/database';

import type { Chapter, ChapterDoc } from './types';

export async function listChapters(novelId: string): Promise<Chapter[]> {
  const chapters = await listChapterRecords(novelId);
  return chapters
    .filter((chapter) => chapter.deletedAt === null)
    .sort((a, b) => a.number - b.number);
}

/** Every chapter of a novel, deleted ones included — sync needs the tombstones. */
export async function listChapterRecords(novelId: string): Promise<Chapter[]> {
  return db.chapters.where('novelId').equals(novelId).toArray();
}

export async function getChapter(id: string): Promise<Chapter | null> {
  const chapter = await db.chapters.get(id);
  return chapter?.deletedAt === null ? chapter : null;
}

/** Adds a chapter at the end of the novel. */
export async function createChapter(novelId: string, title: string): Promise<Chapter> {
  const existing = await listChapters(novelId);
  const lastNumber = existing.at(-1)?.number ?? 0;
  const timestamp = new Date().toISOString();
  const chapter: Chapter = {
    id: crypto.randomUUID(),
    novelId,
    number: lastNumber + 1,
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    driveFolderId: null,
    driveParagraphsFileId: null,
    driveParagraphsModifiedTime: null,
    paragraphsRevision: 0,
    paragraphsSyncedRevision: 0,
  };
  await db.chapters.add(chapter);
  return chapter;
}

export async function setChapterDriveFolderId(id: string, driveFolderId: string): Promise<void> {
  await db.chapters.update(id, { driveFolderId });
}

/** Records which Drive file holds the paragraphs, and what has already been synced. */
export async function setChapterParagraphsSync(
  id: string,
  driveParagraphsFileId: string,
  driveParagraphsModifiedTime: string,
  paragraphsSyncedRevision: number,
): Promise<void> {
  await db.chapters.update(id, {
    driveParagraphsFileId,
    driveParagraphsModifiedTime,
    paragraphsSyncedRevision,
  });
}

/** Applies a chapter found on Drive, keeping whichever copy was updated last. */
export async function mergeRemoteChapter(doc: ChapterDoc, driveFolderId: string): Promise<void> {
  const local = await db.chapters.get(doc.id);
  if (local && local.updatedAt >= doc.updatedAt) {
    if (local.driveFolderId !== driveFolderId) {
      await setChapterDriveFolderId(local.id, driveFolderId);
    }
    return;
  }
  await db.chapters.put({
    id: doc.id,
    novelId: doc.novelId,
    number: doc.number,
    title: doc.title,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt,
    driveFolderId,
    driveParagraphsFileId: local?.driveParagraphsFileId ?? null,
    driveParagraphsModifiedTime: local?.driveParagraphsModifiedTime ?? null,
    paragraphsRevision: local?.paragraphsRevision ?? 0,
    paragraphsSyncedRevision: local?.paragraphsSyncedRevision ?? 0,
  });
}
