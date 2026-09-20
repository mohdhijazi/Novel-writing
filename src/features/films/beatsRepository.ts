import { deleteOwnerImages } from '@/features/images/imagesRepository';
import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import type { Beat, BeatDoc } from './types';

/** The text fields of a beat. */
export type BeatField = 'shotType' | 'visual' | 'camera';

export async function listBeats(sceneId: string): Promise<Beat[]> {
  const beats = await db.beats.where('sceneId').equals(sceneId).toArray();
  return beats.filter((beat) => beat.deletedAt === null).sort((a, b) => a.number - b.number);
}

/** Every beat of a world, deleted ones included — sync needs the tombstones. */
export async function listBeatRecords(worldId: string): Promise<Beat[]> {
  return db.beats.where('worldId').equals(worldId).toArray();
}

/** Adds a beat at the end of the scene. */
export async function createBeat(worldId: string, sceneId: string): Promise<Beat> {
  const existing = await listBeats(sceneId);
  const timestamp = new Date().toISOString();
  const beat: Beat = {
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
  await db.beats.add(beat);
  return beat;
}

export async function saveBeatField(id: string, field: BeatField, value: string): Promise<void> {
  await db.beats.update(id, { [field]: value, updatedAt: new Date().toISOString() });
}

export async function deleteBeat(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.transaction('rw', db.beats, db.images, async () => {
    await removeBeat(id, timestamp);
  });
}

/** Removes every beat of a scene, as part of deleting the scene itself. */
export async function deleteBeatsOfScene(sceneId: string, timestamp: string): Promise<void> {
  const beats = await db.beats.where('sceneId').equals(sceneId).toArray();
  for (const beat of beats) {
    if (beat.deletedAt === null) {
      await removeBeat(beat.id, timestamp);
    }
  }
}

async function removeBeat(id: string, timestamp: string): Promise<void> {
  await db.beats.update(id, { deletedAt: timestamp, updatedAt: timestamp });
  // Its pictures go too, so their files do not stay behind in Drive.
  await deleteOwnerImages(id);
}

/** Applies the beats from Drive; returns whether the local side holds more. */
export async function mergeRemoteBeats(worldId: string, docs: BeatDoc[]): Promise<boolean> {
  const local = await listBeatRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) => ({ ...doc, worldId }));
  if (toStore.length > 0) {
    await db.beats.bulkPut(toStore);
  }
  return localIsAhead;
}
