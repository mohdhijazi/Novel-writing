import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import type { Idea, IdeaDoc } from './types';

/** Newest first: a fresh idea is the one you are still thinking about. */
export async function listIdeas(worldId: string): Promise<Idea[]> {
  const ideas = await listIdeaRecords(worldId);
  return ideas
    .filter((idea) => idea.deletedAt === null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Every idea of a world, deleted ones included — sync needs the tombstones. */
export async function listIdeaRecords(worldId: string): Promise<Idea[]> {
  return db.ideas.where('worldId').equals(worldId).toArray();
}

export async function createIdea(worldId: string, text: string): Promise<Idea> {
  const timestamp = new Date().toISOString();
  const idea: Idea = {
    id: crypto.randomUUID(),
    worldId,
    text,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  await db.ideas.add(idea);
  return idea;
}

/** Adds ideas from an import file, newest last so the file's order is kept. */
export async function addImportedIdeas(worldId: string, texts: string[]): Promise<void> {
  const created = Date.now();
  await db.ideas.bulkAdd(
    texts.map((text, index) => {
      const timestamp = new Date(created + index).toISOString();
      return {
        id: crypto.randomUUID(),
        worldId,
        text,
        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null,
      };
    }),
  );
}

export async function saveIdeaText(id: string, text: string): Promise<void> {
  await db.ideas.update(id, { text, updatedAt: new Date().toISOString() });
}

export async function deleteIdea(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.ideas.update(id, { deletedAt: timestamp, updatedAt: timestamp });
}

/** Applies the ideas from Drive; returns whether the local side holds more. */
export async function mergeRemoteIdeas(worldId: string, docs: IdeaDoc[]): Promise<boolean> {
  const local = await listIdeaRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) => ({ ...doc, worldId }));
  if (toStore.length > 0) {
    await db.ideas.bulkPut(toStore);
  }
  return localIsAhead;
}
