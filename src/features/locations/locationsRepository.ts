import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import { normalizeLocation } from './types';
import type { Location, LocationDoc, LocationTextField } from './types';

export async function listLocations(worldId: string): Promise<Location[]> {
  const locations = await listLocationRecords(worldId);
  return locations
    .filter((location) => location.deletedAt === null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Every location of a world, deleted ones included — sync needs the tombstones. */
export async function listLocationRecords(worldId: string): Promise<Location[]> {
  const locations = await db.locations.where('worldId').equals(worldId).toArray();
  return locations.map(normalizeLocation);
}

export async function createLocation(worldId: string, x: number, y: number): Promise<Location> {
  const timestamp = new Date().toISOString();
  const location: Location = {
    id: crypto.randomUUID(),
    worldId,
    name: '',
    type: '',
    area: '',
    x,
    y,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  await db.locations.add(location);
  return location;
}

/** Adds locations from an import file; returns their ids keyed by name. */
export async function addImportedLocations(
  worldId: string,
  imported: { name: string; type: string; area: string; x: number; y: number }[],
): Promise<Map<string, string>> {
  const timestamp = new Date().toISOString();
  const locations = imported.map((entry) => ({
    ...entry,
    id: crypto.randomUUID(),
    worldId,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  }));
  await db.locations.bulkAdd(locations);
  return new Map(locations.map((location) => [location.name, location.id]));
}

export async function moveLocation(id: string, x: number, y: number): Promise<void> {
  await db.locations.update(id, { x, y, updatedAt: new Date().toISOString() });
}

export async function saveLocationField(
  id: string,
  field: LocationTextField,
  value: string,
): Promise<void> {
  await db.locations.update(id, { [field]: value, updatedAt: new Date().toISOString() });
}

export async function deleteLocation(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.locations.update(id, { deletedAt: timestamp, updatedAt: timestamp });
}

/** Applies the locations from Drive; returns whether the local side holds more. */
export async function mergeRemoteLocations(worldId: string, docs: LocationDoc[]): Promise<boolean> {
  const local = await listLocationRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) =>
    normalizeLocation({ ...doc, worldId }),
  );
  if (toStore.length > 0) {
    await db.locations.bulkPut(toStore);
  }
  return localIsAhead;
}
