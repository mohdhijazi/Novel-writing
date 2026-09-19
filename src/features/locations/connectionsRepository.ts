import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import type { MapSide } from '@/lib/map/geometry';

import type { Connection, ConnectionDoc } from './types';

export async function listConnections(worldId: string): Promise<Connection[]> {
  const connections = await listConnectionRecords(worldId);
  return connections.filter((connection) => connection.deletedAt === null);
}

/** Every connection of a world, deleted ones included — sync needs the tombstones. */
export async function listConnectionRecords(worldId: string): Promise<Connection[]> {
  return db.connections.where('worldId').equals(worldId).toArray();
}

/**
 * Links two locations. Does nothing when they are already linked, in either
 * direction, so dragging the same pair twice cannot double the line.
 */
export async function createConnection(
  worldId: string,
  from: { id: string; side: MapSide },
  toId: string,
): Promise<void> {
  if (from.id === toId) {
    return;
  }
  const existing = await listConnections(worldId);
  const alreadyLinked = existing.some(
    (connection) =>
      (connection.fromId === from.id && connection.toId === toId) ||
      (connection.fromId === toId && connection.toId === from.id),
  );
  if (alreadyLinked) {
    return;
  }

  const timestamp = new Date().toISOString();
  await db.connections.add({
    id: crypto.randomUUID(),
    worldId,
    fromId: from.id,
    fromSide: from.side,
    toId,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  });
}

/** Adds connections from an import file, both ends already resolved to ids. */
export async function addImportedConnections(
  worldId: string,
  pairs: { fromId: string; toId: string }[],
): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.connections.bulkAdd(
    pairs.map((pair) => ({
      id: crypto.randomUUID(),
      worldId,
      fromId: pair.fromId,
      fromSide: 'right' as const,
      toId: pair.toId,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    })),
  );
}

export async function deleteConnection(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.connections.update(id, { deletedAt: timestamp, updatedAt: timestamp });
}

/** Applies the connections from Drive; returns whether the local side holds more. */
export async function mergeRemoteConnections(
  worldId: string,
  docs: ConnectionDoc[],
): Promise<boolean> {
  const local = await listConnectionRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) => ({ ...doc, worldId }));
  if (toStore.length > 0) {
    await db.connections.bulkPut(toStore);
  }
  return localIsAhead;
}
