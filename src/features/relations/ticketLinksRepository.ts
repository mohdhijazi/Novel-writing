import { db } from '@/lib/db/database';
import type { MapSide } from '@/lib/map/geometry';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import type { TicketLink, TicketLinkDoc } from './types';

export async function listTicketLinks(relationId: string): Promise<TicketLink[]> {
  const links = await db.ticketLinks.where('relationId').equals(relationId).toArray();
  return links.filter((link) => link.deletedAt === null);
}

/** Every link of a world, deleted ones included — sync needs the tombstones. */
export async function listTicketLinkRecords(worldId: string): Promise<TicketLink[]> {
  return db.ticketLinks.where('worldId').equals(worldId).toArray();
}

/** Links two tickets. Does nothing if they are already linked, either way round. */
export async function createTicketLink(
  worldId: string,
  relationId: string,
  from: { id: string; side: MapSide },
  toId: string,
): Promise<void> {
  if (from.id === toId) {
    return;
  }
  const existing = await listTicketLinks(relationId);
  const alreadyLinked = existing.some(
    (link) =>
      (link.fromId === from.id && link.toId === toId) ||
      (link.fromId === toId && link.toId === from.id),
  );
  if (alreadyLinked) {
    return;
  }

  const timestamp = new Date().toISOString();
  await db.ticketLinks.add({
    id: crypto.randomUUID(),
    worldId,
    relationId,
    fromId: from.id,
    fromSide: from.side,
    toId,
    label: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  });
}

export async function saveTicketLinkLabel(id: string, label: string): Promise<void> {
  await db.ticketLinks.update(id, { label, updatedAt: new Date().toISOString() });
}

export async function deleteTicketLink(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.ticketLinks.update(id, { deletedAt: timestamp, updatedAt: timestamp });
}

/** Applies the links from Drive; returns whether the local side holds more. */
export async function mergeRemoteTicketLinks(
  worldId: string,
  docs: TicketLinkDoc[],
): Promise<boolean> {
  const local = await listTicketLinkRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) => ({ ...doc, worldId }));
  if (toStore.length > 0) {
    await db.ticketLinks.bulkPut(toStore);
  }
  return localIsAhead;
}
