import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import { normalizeEvent } from './types';
import type { WorldEvent, WorldEventDoc } from './types';

export async function listEvents(worldId: string): Promise<WorldEvent[]> {
  const events = await listEventRecords(worldId);
  return events.filter((event) => event.deletedAt === null);
}

/** Every event of a world, deleted ones included — sync needs the tombstones. */
export async function listEventRecords(worldId: string): Promise<WorldEvent[]> {
  const events = await db.events.where('worldId').equals(worldId).toArray();
  return events.map(normalizeEvent);
}

export async function createEvent(
  worldId: string,
  name: string,
  year: number,
): Promise<WorldEvent> {
  const timestamp = new Date().toISOString();
  const event: WorldEvent = {
    id: crypto.randomUUID(),
    worldId,
    name,
    details: '',
    year,
    monthId: '',
    day: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  await db.events.add(event);
  return event;
}

/** Adds events from an import file, months already resolved to ids. */
export async function addImportedEvents(
  worldId: string,
  imported: { name: string; details: string; year: number; monthId: string; day: number }[],
): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.events.bulkAdd(
    imported.map((entry) => ({
      ...entry,
      id: crypto.randomUUID(),
      worldId,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    })),
  );
}

export async function updateEvent(
  id: string,
  patch: Partial<Pick<WorldEvent, 'name' | 'details' | 'year' | 'monthId' | 'day'>>,
): Promise<void> {
  await db.events.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteEvent(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.events.update(id, { deletedAt: timestamp, updatedAt: timestamp });
}

/** Applies the events from Drive; returns whether the local side holds more. */
export async function mergeRemoteEvents(worldId: string, docs: WorldEventDoc[]): Promise<boolean> {
  const local = await listEventRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) =>
    normalizeEvent({ ...doc, worldId }),
  );
  if (toStore.length > 0) {
    await db.events.bulkPut(toStore);
  }
  return localIsAhead;
}
