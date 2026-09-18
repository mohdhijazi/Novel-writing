import { db } from '@/lib/db/database';

import type { Novel, NovelDoc } from './types';

export async function listNovels(worldId: string): Promise<Novel[]> {
  const novels = await listNovelRecords(worldId);
  return novels
    .filter((novel) => novel.deletedAt === null)
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Every novel of a world, deleted ones included — sync needs the tombstones. */
export async function listNovelRecords(worldId: string): Promise<Novel[]> {
  return db.novels.where('worldId').equals(worldId).toArray();
}

export async function getNovel(id: string): Promise<Novel | null> {
  const novel = await db.novels.get(id);
  return novel?.deletedAt === null ? novel : null;
}

export async function createNovel(worldId: string, title: string): Promise<Novel> {
  const timestamp = new Date().toISOString();
  const novel: Novel = {
    id: crypto.randomUUID(),
    worldId,
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    driveFolderId: null,
  };
  await db.novels.add(novel);
  return novel;
}

export async function setNovelDriveFolderId(id: string, driveFolderId: string): Promise<void> {
  await db.novels.update(id, { driveFolderId });
}

/** Applies a novel found on Drive, keeping whichever copy was updated last. */
export async function mergeRemoteNovel(doc: NovelDoc, driveFolderId: string): Promise<void> {
  const local = await db.novels.get(doc.id);
  if (local && local.updatedAt >= doc.updatedAt) {
    if (local.driveFolderId !== driveFolderId) {
      await setNovelDriveFolderId(local.id, driveFolderId);
    }
    return;
  }
  await db.novels.put({
    id: doc.id,
    worldId: doc.worldId,
    title: doc.title,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt,
    driveFolderId,
  });
}
