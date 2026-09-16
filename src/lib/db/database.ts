import Dexie, { type EntityTable } from 'dexie';

import type { Novel } from '@/features/novels/types';

/**
 * The local database — the source of truth on each device; Drive is a copy.
 *
 * This is the one module that knows about every feature's record types, because
 * Dexie needs all tables declared in one versioned schema. Reads and writes
 * belong in each feature's repository, not here.
 */
class NovelWritingDatabase extends Dexie {
  novels!: EntityTable<Novel, 'id'>;

  constructor() {
    super('novel-writing');
    this.version(1).stores({
      novels: 'id, title, updatedAt',
    });
  }
}

export const db = new NovelWritingDatabase();
