import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import type { Relation, RelationDoc } from './types';

export async function listRelations(worldId: string): Promise<Relation[]> {
  const relations = await listRelationRecords(worldId);
  return relations
    .filter((relation) => relation.deletedAt === null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Every relation of a world, deleted ones included — sync needs the tombstones. */
export async function listRelationRecords(worldId: string): Promise<Relation[]> {
  return db.relations.where('worldId').equals(worldId).toArray();
}

export async function getRelation(id: string): Promise<Relation | null> {
  const relation = await db.relations.get(id);
  return relation?.deletedAt === null ? relation : null;
}

export async function createRelation(worldId: string, name: string): Promise<Relation> {
  const timestamp = new Date().toISOString();
  const relation: Relation = {
    id: crypto.randomUUID(),
    worldId,
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  await db.relations.add(relation);
  return relation;
}

export async function deleteRelation(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.relations.update(id, { deletedAt: timestamp, updatedAt: timestamp });
}

/** Applies the relations from Drive; returns whether the local side holds more. */
export async function mergeRemoteRelations(worldId: string, docs: RelationDoc[]): Promise<boolean> {
  const local = await listRelationRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) => ({ ...doc, worldId }));
  if (toStore.length > 0) {
    await db.relations.bulkPut(toStore);
  }
  return localIsAhead;
}
