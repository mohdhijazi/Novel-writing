import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import type { Location, LocationDoc } from './types';

export async function listLocations(worldId: string): Promise<Location[]> {
  const locations = await listLocationRecords(worldId);
  return locations
    .filter((location) => location.deletedAt === null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Every location of a world, deleted ones included — sync needs the tombstones. */
export async function listLocationRecords(worldId: string): Promise<Location[]> {
  return db.locations.where('worldId').equals(worldId).toArray();
}

export async function createLocation(
  worldId: string,
  name: string,
  x: number,
  y: number,
): Promise<Location> {
  const timestamp = new Date().toISOString();
  const location: Location = {
    id: crypto.randomUUID(),
    worldId,
    name,
    x,
    y,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  await db.locations.add(location);
  return location;
}

export async function moveLocation(id: string, x: number, y: number): Promise<void> {
  await db.locations.update(id, { x, y, updatedAt: new Date().toISOString() });
}

export async function renameLocation(id: string, name: string): Promise<void> {
  await db.locations.update(id, { name, updatedAt: new Date().toISOString() });
}

export async function deleteLocation(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.locations.update(id, { deletedAt: timestamp, updatedAt: timestamp });
}

/** Applies the locations from Drive; returns whether the local side holds more. */
export async function mergeRemoteLocations(worldId: string, docs: LocationDoc[]): Promise<boolean> {
  const local = await listLocationRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) => ({ ...doc, worldId }));
  if (toStore.length > 0) {
    await db.locations.bulkPut(toStore);
  }
  return localIsAhead;
}
