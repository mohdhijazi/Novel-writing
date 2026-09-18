import { syncCollectionForWorld, type CollectionSync } from '@/features/sync/syncCollection';

import { listCalendarRecords, mergeRemoteCalendar } from './calendarRepository';
import type { WorldCalendar, WorldCalendarDoc } from './types';

/**
 * The calendar rides on the collection-file machinery even though a world has
 * only one, so it gets the same merging and upload rules for free.
 */
const calendarSync: CollectionSync<WorldCalendar, WorldCalendarDoc> = {
  collection: 'calendar',
  listRecords: listCalendarRecords,
  mergeRemote: mergeRemoteCalendar,
  toDoc: ({ id, name, months, weekdays, createdAt, updatedAt, deletedAt }) => ({
    id,
    name,
    months,
    weekdays,
    createdAt,
    updatedAt,
    deletedAt,
  }),
};

export async function syncCalendarForWorld(worldId: string, worldFolderId: string): Promise<void> {
  await syncCollectionForWorld(calendarSync, worldId, worldFolderId);
}
