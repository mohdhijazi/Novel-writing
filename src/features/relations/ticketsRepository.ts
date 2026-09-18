import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import type { Ticket, TicketDoc, TicketKind } from './types';

export async function listTickets(relationId: string): Promise<Ticket[]> {
  const tickets = await db.tickets.where('relationId').equals(relationId).toArray();
  return tickets
    .filter((ticket) => ticket.deletedAt === null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Every ticket of a world, deleted ones included — sync needs the tombstones. */
export async function listTicketRecords(worldId: string): Promise<Ticket[]> {
  return db.tickets.where('worldId').equals(worldId).toArray();
}

export async function createTicket(
  worldId: string,
  relationId: string,
  kind: TicketKind,
  refId: string,
  x: number,
  y: number,
): Promise<Ticket> {
  const timestamp = new Date().toISOString();
  const ticket: Ticket = {
    id: crypto.randomUUID(),
    worldId,
    relationId,
    kind,
    refId,
    text: '',
    x,
    y,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  await db.tickets.add(ticket);
  return ticket;
}

export async function moveTicket(id: string, x: number, y: number): Promise<void> {
  await db.tickets.update(id, { x, y, updatedAt: new Date().toISOString() });
}

export async function saveTicketText(id: string, text: string): Promise<void> {
  await db.tickets.update(id, { text, updatedAt: new Date().toISOString() });
}

export async function deleteTicket(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.tickets.update(id, { deletedAt: timestamp, updatedAt: timestamp });
}

/** Applies the tickets from Drive; returns whether the local side holds more. */
export async function mergeRemoteTickets(worldId: string, docs: TicketDoc[]): Promise<boolean> {
  const local = await listTicketRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) => ({ ...doc, worldId }));
  if (toStore.length > 0) {
    await db.tickets.bulkPut(toStore);
  }
  return localIsAhead;
}
