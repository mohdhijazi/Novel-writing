import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import type { Scene, SceneDoc } from './types';

export async function listScenes(episodeId: string): Promise<Scene[]> {
  const scenes = await db.scenes.where('episodeId').equals(episodeId).toArray();
  return scenes.filter((scene) => scene.deletedAt === null).sort((a, b) => a.number - b.number);
}

/** Every scene of a world, deleted ones included — sync needs the tombstones. */
export async function listSceneRecords(worldId: string): Promise<Scene[]> {
  return db.scenes.where('worldId').equals(worldId).toArray();
}

/** Adds a scene at the end of the episode. */
export async function createScene(
  worldId: string,
  episodeId: string,
  title: string,
): Promise<Scene> {
  const existing = await listScenes(episodeId);
  const timestamp = new Date().toISOString();
  const scene: Scene = {
    id: crypto.randomUUID(),
    worldId,
    episodeId,
    number: (existing.at(-1)?.number ?? 0) + 1,
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  await db.scenes.add(scene);
  return scene;
}

export async function deleteScene(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.scenes.update(id, { deletedAt: timestamp, updatedAt: timestamp });
}

/** Removes every scene of an episode, as part of deleting the episode itself. */
export async function deleteScenesOfEpisode(episodeId: string, timestamp: string): Promise<void> {
  const scenes = await db.scenes.where('episodeId').equals(episodeId).toArray();
  for (const scene of scenes) {
    if (scene.deletedAt === null) {
      await db.scenes.update(scene.id, { deletedAt: timestamp, updatedAt: timestamp });
    }
  }
}

/** Applies the scenes from Drive; returns whether the local side holds more. */
export async function mergeRemoteScenes(worldId: string, docs: SceneDoc[]): Promise<boolean> {
  const local = await listSceneRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) => ({ ...doc, worldId }));
  if (toStore.length > 0) {
    await db.scenes.bulkPut(toStore);
  }
  return localIsAhead;
}
