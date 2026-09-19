import { syncCollectionForWorld, type CollectionSync } from '@/features/sync/syncCollection';

import { listConnectionRecords, mergeRemoteConnections } from './connectionsRepository';
import type { Connection, ConnectionDoc } from './types';

const connectionSync: CollectionSync<Connection, ConnectionDoc> = {
  collection: 'connections',
  listRecords: listConnectionRecords,
  mergeRemote: mergeRemoteConnections,
  toDoc: ({ id, fromId, fromSide, toId, createdAt, updatedAt, deletedAt }) => ({
    id,
    fromId,
    fromSide,
    toId,
    createdAt,
    updatedAt,
    deletedAt,
  }),
};

export async function syncConnectionsForWorld(
  worldId: string,
  worldFolderId: string,
): Promise<void> {
  await syncCollectionForWorld(connectionSync, worldId, worldFolderId);
}
