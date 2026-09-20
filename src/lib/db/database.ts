import Dexie, { type EntityTable } from 'dexie';

import type { WorldCalendar } from '@/features/calendar/types';
import type { Character } from '@/features/characters/types';
import type { WorldEvent } from '@/features/events/types';
import type { DialogueLine, Episode, Film, Scene, Shot } from '@/features/films/types';
import type { Idea } from '@/features/ideas/types';
import type { WorldImage } from '@/features/images/types';
import type { Connection, Location } from '@/features/locations/types';
import type { Relation, Ticket, TicketLink } from '@/features/relations/types';
import type { SyncMeta } from '@/features/sync/syncMeta';
import type { Chapter, Novel, Paragraph } from '@/features/novels/types';
import type { World } from '@/features/worlds/types';
import type { StoredRecord } from '@/lib/storage/collectionFile';

/** A dialogue line as version 13 stored it: tied to a scene and a beat number. */
interface OldDialogueLine extends StoredRecord {
  worldId: string;
  sceneId: string;
  order: number;
  speaker: string;
  line: string;
  delivery: string;
  beatNumber: number;
  createdAt: string;
}

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
  relations!: EntityTable<Relation, 'id'>;
  tickets!: EntityTable<Ticket, 'id'>;
  ticketLinks!: EntityTable<TicketLink, 'id'>;
  images!: EntityTable<WorldImage, 'id'>;
  films!: EntityTable<Film, 'id'>;
  episodes!: EntityTable<Episode, 'id'>;
  scenes!: EntityTable<Scene, 'id'>;
  shots!: EntityTable<Shot, 'id'>;
  dialogueLines!: EntityTable<DialogueLine, 'id'>;
  syncMeta!: EntityTable<SyncMeta, 'id'>;

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
    this.version(9).stores({
      relations: 'id, worldId, name, updatedAt',
      tickets: 'id, worldId, relationId, updatedAt',
      ticketLinks: 'id, worldId, relationId, updatedAt',
    });
    this.version(10).stores({
      syncMeta: 'id',
    });
    this.version(11).stores({
      images: 'id, worldId, ownerId, updatedAt',
    });
    this.version(12).stores({
      films: 'id, worldId, title, updatedAt',
      episodes: 'id, worldId, filmId, number, updatedAt',
      scenes: 'id, worldId, episodeId, number, updatedAt',
    });
    this.version(13).stores({
      beats: 'id, worldId, sceneId, number, updatedAt',
      dialogueLines: 'id, worldId, sceneId, order, updatedAt',
    });
    // Beats became shots, and a line of dialogue now belongs to the shot it is
    // said over rather than to the scene. Two versions: the records move while
    // the old table is still there, and only then is it dropped.
    this.version(14)
      .stores({
        shots: 'id, worldId, sceneId, number, updatedAt',
        dialogueLines: 'id, worldId, shotId, order, updatedAt',
      })
      .upgrade(async (tx) => {
        const timestamp = new Date().toISOString();
        const shots = tx.table<Shot>('shots');
        // A beat had exactly a shot's shape, so they are read as shots.
        const beats = await tx.table<Shot>('beats').toArray();
        await shots.bulkAdd(beats.map((beat) => ({ ...beat, updatedAt: timestamp })));

        const byScene = new Map<string, Shot[]>();
        for (const beat of beats) {
          byScene.set(beat.sceneId, [...(byScene.get(beat.sceneId) ?? []), beat]);
        }

        const oldLines = await tx.table<OldDialogueLine>('dialogueLines').toArray();
        const lines = tx.table<DialogueLine>('dialogueLines');
        for (const old of oldLines) {
          const inScene = [...(byScene.get(old.sceneId) ?? [])].sort((a, b) => a.number - b.number);
          let shot = inScene.find((candidate) => candidate.number === old.beatNumber) ?? inScene[0];
          if (shot === undefined) {
            // A line written before its scene had a shot still has to be said
            // over something, so it is given one rather than dropped.
            shot = {
              id: crypto.randomUUID(),
              worldId: old.worldId,
              sceneId: old.sceneId,
              number: 1,
              shotType: '',
              visual: '',
              camera: '',
              createdAt: timestamp,
              updatedAt: timestamp,
              deletedAt: null,
            };
            await shots.add(shot);
            byScene.set(old.sceneId, [shot]);
          }
          await lines.put({
            id: old.id,
            worldId: old.worldId,
            shotId: shot.id,
            order: old.order,
            speaker: old.speaker,
            line: old.line,
            delivery: old.delivery,
            createdAt: old.createdAt,
            updatedAt: timestamp,
            deletedAt: old.deletedAt,
          });
        }
      });
    this.version(15).stores({ beats: null });
  }
}

export const db = new WorldBuildingDatabase();
