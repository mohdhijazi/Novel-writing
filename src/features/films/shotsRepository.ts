import { deleteOwnerImages } from '@/features/images/imagesRepository';
import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import { deleteDialogueOfShot } from './dialogueRepository';
import type { Shot, ShotDoc } from './types';

/** The text fields of a shot. */
export type ShotField = 'shotType' | 'visual' | 'camera';

export async function listShots(sceneId: string): Promise<Shot[]> {
  const shots = await db.shots.where('sceneId').equals(sceneId).toArray();
  return shots.filter((shot) => shot.deletedAt === null).sort((a, b) => a.number - b.number);
}

/** Every shot of a world, deleted ones included — sync needs the tombstones. */
export async function listShotRecords(worldId: string): Promise<Shot[]> {
  return db.shots.where('worldId').equals(worldId).toArray();
}

/** Adds a shot at the end of the scene. */
export async function createShot(worldId: string, sceneId: string): Promise<Shot> {
  const existing = await listShots(sceneId);
  const timestamp = new Date().toISOString();
  const shot: Shot = {
    id: crypto.randomUUID(),
    worldId,
    sceneId,
    number: (existing.at(-1)?.number ?? 0) + 1,
    shotType: '',
    visual: '',
    camera: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  await db.shots.add(shot);
  return shot;
}

/** Adds shots from pasted JSON, numbered in the order they arrived. */
export async function addImportedShots(
  worldId: string,
  sceneId: string,
  shots: Pick<Shot, 'shotType' | 'visual' | 'camera'>[],
): Promise<Shot[]> {
  const added: Shot[] = [];
  for (const fields of shots) {
    const shot = await createShot(worldId, sceneId);
    const filled = { ...shot, ...fields };
    await db.shots.put(filled);
    added.push(filled);
  }
  return added;
}

export async function saveShotField(id: string, field: ShotField, value: string): Promise<void> {
  await db.shots.update(id, { [field]: value, updatedAt: new Date().toISOString() });
}

export async function deleteShot(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  // One transaction, so a shot never goes without its lines and pictures.
  await db.transaction('rw', [db.shots, db.dialogueLines, db.images], async () => {
    await removeShot(id, timestamp);
  });
}

/** Removes every shot of a scene, as part of deleting the scene itself. */
export async function deleteShotsOfScene(sceneId: string, timestamp: string): Promise<void> {
  const shots = await db.shots.where('sceneId').equals(sceneId).toArray();
  for (const shot of shots) {
    if (shot.deletedAt === null) {
      await removeShot(shot.id, timestamp);
    }
  }
}

async function removeShot(id: string, timestamp: string): Promise<void> {
  await db.shots.update(id, { deletedAt: timestamp, updatedAt: timestamp });
  await deleteDialogueOfShot(id, timestamp);
  // Its pictures go too, so their files do not stay behind in Drive.
  await deleteOwnerImages(id);
}

/** Applies the shots from Drive; returns whether the local side holds more. */
export async function mergeRemoteShots(worldId: string, docs: ShotDoc[]): Promise<boolean> {
  const local = await listShotRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) => ({ ...doc, worldId }));
  if (toStore.length > 0) {
    await db.shots.bulkPut(toStore);
  }
  return localIsAhead;
}
