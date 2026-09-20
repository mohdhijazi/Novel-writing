import { syncCollectionForWorld, type CollectionSync } from '@/features/sync/syncCollection';

import { listEpisodeRecords, mergeRemoteEpisodes } from './episodesRepository';
import { listFilmRecords, mergeRemoteFilms } from './filmsRepository';
import { listSceneRecords, mergeRemoteScenes } from './scenesRepository';
import type { Episode, EpisodeDoc, Film, FilmDoc, Scene, SceneDoc } from './types';

const filmSync: CollectionSync<Film, FilmDoc> = {
  collection: 'films',
  listRecords: listFilmRecords,
  mergeRemote: mergeRemoteFilms,
  toDoc: ({ id, title, createdAt, updatedAt, deletedAt }) => ({
    id,
    title,
    createdAt,
    updatedAt,
    deletedAt,
  }),
};

const episodeSync: CollectionSync<Episode, EpisodeDoc> = {
  collection: 'episodes',
  listRecords: listEpisodeRecords,
  mergeRemote: mergeRemoteEpisodes,
  toDoc: ({ id, filmId, number, title, createdAt, updatedAt, deletedAt }) => ({
    id,
    filmId,
    number,
    title,
    createdAt,
    updatedAt,
    deletedAt,
  }),
};

const sceneSync: CollectionSync<Scene, SceneDoc> = {
  collection: 'scenes',
  listRecords: listSceneRecords,
  mergeRemote: mergeRemoteScenes,
  toDoc: ({ id, episodeId, number, title, createdAt, updatedAt, deletedAt }) => ({
    id,
    episodeId,
    number,
    title,
    createdAt,
    updatedAt,
    deletedAt,
  }),
};

export async function syncFilmsForWorld(worldId: string, worldFolderId: string): Promise<void> {
  await syncCollectionForWorld(filmSync, worldId, worldFolderId);
  await syncCollectionForWorld(episodeSync, worldId, worldFolderId);
  await syncCollectionForWorld(sceneSync, worldId, worldFolderId);
}
