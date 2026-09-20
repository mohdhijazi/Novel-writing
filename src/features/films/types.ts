import type { StoredRecord } from '@/lib/storage/collectionFile';

/**
 * Film, episode and scene are three flat collections rather than nested
 * folders, the way relations, tickets and links are: each record names its
 * parent, so one file per kind syncs the whole hierarchy.
 */

/** A film or series set in a world. */
export interface Film extends StoredRecord {
  worldId: string;
  title: string;
  createdAt: string;
}

export interface Episode extends StoredRecord {
  worldId: string;
  filmId: string;
  /** Position in the film, shown next to the title. */
  number: number;
  title: string;
  createdAt: string;
}

/** A scene in an episode. What else a scene holds comes later. */
export interface Scene extends StoredRecord {
  worldId: string;
  episodeId: string;
  /** Position in the episode. */
  number: number;
  title: string;
  createdAt: string;
}

export type FilmDoc = Omit<Film, 'worldId'>;
export type EpisodeDoc = Omit<Episode, 'worldId'>;
export type SceneDoc = Omit<Scene, 'worldId'>;
