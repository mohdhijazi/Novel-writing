import Dexie, { type EntityTable } from 'dexie';

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

  constructor() {
    super('world-building');
    this.version(1).stores({
      worlds: 'id, name, updatedAt',
    });
  }
}

export const db = new WorldBuildingDatabase();
