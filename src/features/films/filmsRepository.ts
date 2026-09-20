import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import { deleteEpisodesOfFilm } from './episodesRepository';
import type { Film, FilmDoc } from './types';

export async function listFilms(worldId: string): Promise<Film[]> {
  const films = await listFilmRecords(worldId);
  return films
    .filter((film) => film.deletedAt === null)
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Every film of a world, deleted ones included — sync needs the tombstones. */
export async function listFilmRecords(worldId: string): Promise<Film[]> {
  return db.films.where('worldId').equals(worldId).toArray();
}

export async function getFilm(id: string): Promise<Film | null> {
  const film = await db.films.get(id);
  return film?.deletedAt === null ? film : null;
}

export async function createFilm(worldId: string, title: string): Promise<Film> {
  const timestamp = new Date().toISOString();
  const film: Film = {
    id: crypto.randomUUID(),
    worldId,
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  await db.films.add(film);
  return film;
}

export async function deleteFilm(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  // One transaction, so a film never goes without its episodes and scenes.
  await db.transaction(
    'rw',
    [db.films, db.episodes, db.scenes, db.shots, db.dialogueLines, db.images],
    async () => {
      await db.films.update(id, { deletedAt: timestamp, updatedAt: timestamp });
      await deleteEpisodesOfFilm(id, timestamp);
    },
  );
}

/** Applies the films from Drive; returns whether the local side holds more. */
export async function mergeRemoteFilms(worldId: string, docs: FilmDoc[]): Promise<boolean> {
  const local = await listFilmRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) => ({ ...doc, worldId }));
  if (toStore.length > 0) {
    await db.films.bulkPut(toStore);
  }
  return localIsAhead;
}
