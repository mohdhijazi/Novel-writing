import { syncCollectionForWorld, type CollectionSync } from '@/features/sync/syncCollection';

import { listRelationRecords, mergeRemoteRelations } from './relationsRepository';
import { listTicketLinkRecords, mergeRemoteTicketLinks } from './ticketLinksRepository';
import { listTicketRecords, mergeRemoteTickets } from './ticketsRepository';
import type { Relation, RelationDoc, Ticket, TicketDoc, TicketLink, TicketLinkDoc } from './types';

const relationSync: CollectionSync<Relation, RelationDoc> = {
  collection: 'relations',
  listRecords: listRelationRecords,
  mergeRemote: mergeRemoteRelations,
  toDoc: ({ id, name, createdAt, updatedAt, deletedAt }) => ({
    id,
    name,
    createdAt,
    updatedAt,
    deletedAt,
  }),
};

const ticketSync: CollectionSync<Ticket, TicketDoc> = {
  collection: 'tickets',
  listRecords: listTicketRecords,
  mergeRemote: mergeRemoteTickets,
  toDoc: ({ id, relationId, kind, refId, text, x, y, createdAt, updatedAt, deletedAt }) => ({
    id,
    relationId,
    kind,
    refId,
    text,
    x,
    y,
    createdAt,
    updatedAt,
    deletedAt,
  }),
};

const ticketLinkSync: CollectionSync<TicketLink, TicketLinkDoc> = {
  collection: 'ticketLinks',
  listRecords: listTicketLinkRecords,
  mergeRemote: mergeRemoteTicketLinks,
  toDoc: ({ id, relationId, fromId, fromSide, toId, label, createdAt, updatedAt, deletedAt }) => ({
    id,
    relationId,
    fromId,
    fromSide,
    toId,
    label,
    createdAt,
    updatedAt,
    deletedAt,
  }),
};

export async function syncRelationsForWorld(worldId: string, worldFolderId: string): Promise<void> {
  await syncCollectionForWorld(relationSync, worldId, worldFolderId);
  await syncCollectionForWorld(ticketSync, worldId, worldFolderId);
  await syncCollectionForWorld(ticketLinkSync, worldId, worldFolderId);
}
