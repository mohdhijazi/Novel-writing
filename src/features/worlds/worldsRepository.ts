import { db } from '@/lib/db/database';

import type { World, WorldDoc } from './types';

export async function listWorlds(): Promise<World[]> {
  const worlds = await listWorldRecords();
  return worlds
    .filter((world) => world.deletedAt === null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Every world, deleted ones included — sync needs the tombstones. */
export async function listWorldRecords(): Promise<World[]> {
  return db.worlds.toArray();
}

export async function getWorld(id: string): Promise<World | null> {
  const world = await db.worlds.get(id);
  return world?.deletedAt === null ? world : null;
}

export async function createWorld(name: string): Promise<World> {
  const timestamp = new Date().toISOString();
  const world: World = {
    id: crypto.randomUUID(),
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    driveFolderId: null,
  };
  await db.worlds.add(world);
  return world;
}

export async function setDriveFolderId(worldId: string, driveFolderId: string): Promise<void> {
  await db.worlds.update(worldId, { driveFolderId });
}

/** Applies a world found on Drive, keeping whichever copy was updated last. */
export async function mergeRemoteWorld(doc: WorldDoc, driveFolderId: string): Promise<void> {
  const local = await db.worlds.get(doc.id);
  if (local && local.updatedAt >= doc.updatedAt) {
    if (local.driveFolderId !== driveFolderId) {
      await setDriveFolderId(local.id, driveFolderId);
    }
    return;
  }
  await db.worlds.put({
    id: doc.id,
    name: doc.name,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt,
    driveFolderId,
  });
}
