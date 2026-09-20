import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import { deleteScenesOfEpisode } from './scenesRepository';
import type { Episode, EpisodeDoc } from './types';

export async function listEpisodes(filmId: string): Promise<Episode[]> {
  const episodes = await db.episodes.where('filmId').equals(filmId).toArray();
  return episodes
    .filter((episode) => episode.deletedAt === null)
    .sort((a, b) => a.number - b.number);
}

/** Every episode of a world, deleted ones included — sync needs the tombstones. */
export async function listEpisodeRecords(worldId: string): Promise<Episode[]> {
  return db.episodes.where('worldId').equals(worldId).toArray();
}

export async function getEpisode(id: string): Promise<Episode | null> {
  const episode = await db.episodes.get(id);
  return episode?.deletedAt === null ? episode : null;
}

/** Adds an episode at the end of the film. */
export async function createEpisode(
  worldId: string,
  filmId: string,
  title: string,
): Promise<Episode> {
  const existing = await listEpisodes(filmId);
  const timestamp = new Date().toISOString();
  const episode: Episode = {
    id: crypto.randomUUID(),
    worldId,
    filmId,
    number: (existing.at(-1)?.number ?? 0) + 1,
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  await db.episodes.add(episode);
  return episode;
}

export async function deleteEpisode(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  // One transaction, so an episode never goes without its scenes.
  await db.transaction('rw', db.episodes, db.scenes, async () => {
    await removeEpisode(id, timestamp);
  });
}

/** Removes every episode of a film, as part of deleting the film itself. */
export async function deleteEpisodesOfFilm(filmId: string, timestamp: string): Promise<void> {
  const episodes = await db.episodes.where('filmId').equals(filmId).toArray();
  for (const episode of episodes) {
    if (episode.deletedAt === null) {
      await removeEpisode(episode.id, timestamp);
    }
  }
}

async function removeEpisode(id: string, timestamp: string): Promise<void> {
  await db.episodes.update(id, { deletedAt: timestamp, updatedAt: timestamp });
  // Its scenes go too, or they would linger with nothing to reach them by.
  await deleteScenesOfEpisode(id, timestamp);
}

/** Applies the episodes from Drive; returns whether the local side holds more. */
export async function mergeRemoteEpisodes(worldId: string, docs: EpisodeDoc[]): Promise<boolean> {
  const local = await listEpisodeRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) => ({ ...doc, worldId }));
  if (toStore.length > 0) {
    await db.episodes.bulkPut(toStore);
  }
  return localIsAhead;
}
