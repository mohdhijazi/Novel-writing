import { syncCollectionForWorld, type CollectionSync } from '@/features/sync/syncCollection';

import { listLocationRecords, mergeRemoteLocations } from './locationsRepository';
import type { Location, LocationDoc } from './types';

const locationSync: CollectionSync<Location, LocationDoc> = {
  collection: 'locations',
  listRecords: listLocationRecords,
  mergeRemote: mergeRemoteLocations,
  toDoc: ({ id, name, x, y, createdAt, updatedAt, deletedAt }) => ({
    id,
    name,
    x,
    y,
    createdAt,
    updatedAt,
    deletedAt,
  }),
};

export async function syncLocationsForWorld(worldId: string, worldFolderId: string): Promise<void> {
  await syncCollectionForWorld(locationSync, worldId, worldFolderId);
}
