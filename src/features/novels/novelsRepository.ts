import { db } from '@/lib/db/database';

import type { Novel } from './types';

export async function listNovels(worldId: string): Promise<Novel[]> {
  const novels = await db.novels.where('worldId').equals(worldId).toArray();
  return novels
    .filter((novel) => novel.deletedAt === null)
    .sort((a, b) => a.title.localeCompare(b.title));
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
