import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import { deleteShotsOfScene } from './shotsRepository';
import { normalizeScene } from './types';
import type { Scene, SceneDoc, SceneTextField } from './types';

export async function listScenes(episodeId: string): Promise<Scene[]> {
  const scenes = await db.scenes.where('episodeId').equals(episodeId).toArray();
  return scenes
    .filter((scene) => scene.deletedAt === null)
    .map(normalizeScene)
    .sort((a, b) => a.number - b.number);
}

/**
 * Every scene of a world, deleted ones included — sync needs the tombstones.
 * Records are normalized on the way out, so fields added after they were
 * written read as empty instead of undefined.
 */
export async function listSceneRecords(worldId: string): Promise<Scene[]> {
  const scenes = await db.scenes.where('worldId').equals(worldId).toArray();
  return scenes.map(normalizeScene);
}

export async function getScene(id: string): Promise<Scene | null> {
  const scene = await db.scenes.get(id);
  return scene?.deletedAt === null ? normalizeScene(scene) : null;
}

/** Adds a scene at the end of the episode. */
export async function createScene(
  worldId: string,
  episodeId: string,
  title: string,
): Promise<Scene> {
  const existing = await listScenes(episodeId);
  const number = (existing.at(-1)?.number ?? 0) + 1;
  const episode = await db.episodes.get(episodeId);
  const timestamp = new Date().toISOString();
  const scene = normalizeScene({
    id: crypto.randomUUID(),
    worldId,
    episodeId,
    number,
    title,
    // A first guess at the pipeline's id, from what the app knows; the chapter
    // it came from is the writer's to add.
    sceneCode: `Ep${pad(episode?.number ?? 0)}_Sc${pad(number)}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  } as Scene);
  await db.scenes.add(scene);
  return scene;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Adds a scene from pasted JSON, with whatever fields it carried. */
export async function addImportedScene(
  worldId: string,
  episodeId: string,
  fields: Partial<Record<SceneTextField, string>>,
): Promise<Scene> {
  const scene = await createScene(worldId, episodeId, fields.title ?? '');
  const filled = { ...scene, ...fields };
  await db.scenes.put(filled);
  return filled;
}

export async function saveSceneField(
  id: string,
  field: SceneTextField,
  value: string,
): Promise<void> {
  await db.scenes.update(id, { [field]: value, updatedAt: new Date().toISOString() });
}

export async function deleteScene(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  // One transaction, so a scene never goes without its shots and their lines.
  await db.transaction('rw', [db.scenes, db.shots, db.dialogueLines, db.images], async () => {
    await removeScene(id, timestamp);
  });
}

/** Removes every scene of an episode, as part of deleting the episode itself. */
export async function deleteScenesOfEpisode(episodeId: string, timestamp: string): Promise<void> {
  const scenes = await db.scenes.where('episodeId').equals(episodeId).toArray();
  for (const scene of scenes) {
    if (scene.deletedAt === null) {
      await removeScene(scene.id, timestamp);
    }
  }
}

async function removeScene(id: string, timestamp: string): Promise<void> {
  await db.scenes.update(id, { deletedAt: timestamp, updatedAt: timestamp });
  await deleteShotsOfScene(id, timestamp);
}

/** Applies the scenes from Drive; returns whether the local side holds more. */
export async function mergeRemoteScenes(worldId: string, docs: SceneDoc[]): Promise<boolean> {
  const local = await listSceneRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) =>
    normalizeScene({ ...doc, worldId }),
  );
  if (toStore.length > 0) {
    await db.scenes.bulkPut(toStore);
  }
  return localIsAhead;
}
