import Dexie, { type EntityTable } from 'dexie';

import type { WorldCalendar } from '@/features/calendar/types';
import type { Character } from '@/features/characters/types';
import type { WorldEvent } from '@/features/events/types';
import type { Idea } from '@/features/ideas/types';
import type { Connection, Location } from '@/features/locations/types';
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
  characters!: EntityTable<Character, 'id'>;
  locations!: EntityTable<Location, 'id'>;
  connections!: EntityTable<Connection, 'id'>;
  calendars!: EntityTable<WorldCalendar, 'id'>;
  events!: EntityTable<WorldEvent, 'id'>;
  ideas!: EntityTable<Idea, 'id'>;

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
    this.version(3).stores({
      characters: 'id, worldId, lastName, updatedAt',
    });
    this.version(4).stores({
      locations: 'id, worldId, updatedAt',
    });
    this.version(5).stores({
      connections: 'id, worldId, fromId, toId, updatedAt',
    });
    this.version(6).stores({
      calendars: 'id, worldId, updatedAt',
    });
    this.version(7).stores({
      events: 'id, worldId, year, updatedAt',
    });
    this.version(8).stores({
      ideas: 'id, worldId, createdAt, updatedAt',
    });
  }
}

export const db = new WorldBuildingDatabase();
