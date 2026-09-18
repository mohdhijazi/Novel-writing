import { syncCollectionForWorld, type CollectionSync } from '@/features/sync/syncCollection';

import { listIdeaRecords, mergeRemoteIdeas } from './ideasRepository';
import type { Idea, IdeaDoc } from './types';

const ideaSync: CollectionSync<Idea, IdeaDoc> = {
  collection: 'ideas',
  listRecords: listIdeaRecords,
  mergeRemote: mergeRemoteIdeas,
  toDoc: ({ id, text, createdAt, updatedAt, deletedAt }) => ({
    id,
    text,
    createdAt,
    updatedAt,
    deletedAt,
  }),
};

export async function syncIdeasForWorld(worldId: string, worldFolderId: string): Promise<void> {
  await syncCollectionForWorld(ideaSync, worldId, worldFolderId);
}
