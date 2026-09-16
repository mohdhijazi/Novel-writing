import { db } from '@/lib/db/database';

import type { Chapter } from './types';

export async function listChapters(novelId: string): Promise<Chapter[]> {
  const chapters = await db.chapters.where('novelId').equals(novelId).toArray();
  return chapters
    .filter((chapter) => chapter.deletedAt === null)
    .sort((a, b) => a.number - b.number);
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
  };
  await db.chapters.add(chapter);
  return chapter;
}

export async function renameChapter(id: string, title: string): Promise<void> {
  await db.chapters.update(id, { title, updatedAt: new Date().toISOString() });
}
