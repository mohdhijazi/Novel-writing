import { syncCollectionForWorld, type CollectionSync } from '@/features/sync/syncCollection';

import { listEventRecords, mergeRemoteEvents } from './eventsRepository';
import type { WorldEvent, WorldEventDoc } from './types';

const eventSync: CollectionSync<WorldEvent, WorldEventDoc> = {
  collection: 'events',
  listRecords: listEventRecords,
  mergeRemote: mergeRemoteEvents,
  toDoc: ({ id, name, details, year, monthId, day, createdAt, updatedAt, deletedAt }) => ({
    id,
    name,
    details,
    year,
    monthId,
    day,
    createdAt,
    updatedAt,
    deletedAt,
  }),
};

export async function syncEventsForWorld(worldId: string, worldFolderId: string): Promise<void> {
  await syncCollectionForWorld(eventSync, worldId, worldFolderId);
}
