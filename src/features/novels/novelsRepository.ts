import { db } from '@/lib/db/database';

import type { Novel, NovelDoc } from './types';

export async function listNovels(): Promise<Novel[]> {
  const novels = await db.novels.toArray();
  return novels
    .filter((novel) => novel.deletedAt === null)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function createNovel(title: string): Promise<Novel> {
  const timestamp = new Date().toISOString();
  const novel: Novel = {
    id: crypto.randomUUID(),
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    driveFolderId: null,
  };
  await db.novels.add(novel);
  return novel;
}

export async function setDriveFolderId(novelId: string, driveFolderId: string): Promise<void> {
  await db.novels.update(novelId, { driveFolderId });
}

/** Applies a novel found on Drive, keeping whichever copy was updated last. */
export async function mergeRemoteNovel(doc: NovelDoc, driveFolderId: string): Promise<void> {
  const local = await db.novels.get(doc.id);
  if (local && local.updatedAt >= doc.updatedAt) {
    if (local.driveFolderId !== driveFolderId) {
      await setDriveFolderId(local.id, driveFolderId);
    }
    return;
  }
  await db.novels.put({
    id: doc.id,
    title: doc.title,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt,
    driveFolderId,
  });
}
