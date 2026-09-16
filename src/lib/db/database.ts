import Dexie, { type EntityTable } from 'dexie';

import type { Chapter, Novel, Paragraph } from '@/features/novels/types';
import type { World } from '@/features/worlds/types';

/**
 * The local database — the source of truth on each device; Drive is a copy.
 *
 * This is the one module that knows about every feature's record types, because
 * Dexie needs all tables declared in one versioned schema. Reads and writes
 * belong in each feature's repository, not here.
 */
class WorldBuildingDatabase extends Dexie {
  worlds!: EntityTable<World, 'id'>;
  novels!: EntityTable<Novel, 'id'>;
  chapters!: EntityTable<Chapter, 'id'>;
  paragraphs!: EntityTable<Paragraph, 'id'>;

  constructor() {
    super('world-building');
    this.version(1).stores({
      worlds: 'id, name, updatedAt',
    });
    this.version(2).stores({
      worlds: 'id, name, updatedAt',
      novels: 'id, worldId, title, updatedAt',
      chapters: 'id, novelId, number, updatedAt',
      paragraphs: 'id, chapterId, [chapterId+order], updatedAt',
    });
  }
}

export const db = new WorldBuildingDatabase();
