import { syncCollectionForWorld, type CollectionSync } from '@/features/sync/syncCollection';

import { listDialogueRecords, mergeRemoteDialogue } from './dialogueRepository';
import { listEpisodeRecords, mergeRemoteEpisodes } from './episodesRepository';
import { listFilmRecords, mergeRemoteFilms } from './filmsRepository';
import { listSceneRecords, mergeRemoteScenes } from './scenesRepository';
import { listShotRecords, mergeRemoteShots } from './shotsRepository';
import { SCENE_TEXT_FIELDS } from './types';
import type {
  DialogueLine,
  DialogueLineDoc,
  Episode,
  EpisodeDoc,
  Film,
  FilmDoc,
  Scene,
  SceneDoc,
  Shot,
  ShotDoc,
} from './types';

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
  // A scene has many fields and gains more; they are taken from the one list
  // that names them, so a new field syncs without being added here too.
  toDoc: (scene) => {
    const text = Object.fromEntries(SCENE_TEXT_FIELDS.map((field) => [field, scene[field]]));
    return {
      id: scene.id,
      episodeId: scene.episodeId,
      number: scene.number,
      createdAt: scene.createdAt,
      updatedAt: scene.updatedAt,
      deletedAt: scene.deletedAt,
      ...text,
    } as SceneDoc;
  },
};

const shotSync: CollectionSync<Shot, ShotDoc> = {
  collection: 'shots',
  listRecords: listShotRecords,
  mergeRemote: mergeRemoteShots,
  toDoc: ({ id, sceneId, number, shotType, visual, camera, createdAt, updatedAt, deletedAt }) => ({
    id,
    sceneId,
    number,
    shotType,
    visual,
    camera,
    createdAt,
    updatedAt,
    deletedAt,
  }),
};

const dialogueSync: CollectionSync<DialogueLine, DialogueLineDoc> = {
  collection: 'dialogueLines',
  listRecords: listDialogueRecords,
  mergeRemote: mergeRemoteDialogue,
  toDoc: ({ id, shotId, order, speaker, line, delivery, createdAt, updatedAt, deletedAt }) => ({
    id,
    shotId,
    order,
    speaker,
    line,
    delivery,
    createdAt,
    updatedAt,
    deletedAt,
  }),
};

export async function syncFilmsForWorld(worldId: string, worldFolderId: string): Promise<void> {
  await syncCollectionForWorld(filmSync, worldId, worldFolderId);
  await syncCollectionForWorld(episodeSync, worldId, worldFolderId);
  await syncCollectionForWorld(sceneSync, worldId, worldFolderId);
  await syncCollectionForWorld(shotSync, worldId, worldFolderId);
  await syncCollectionForWorld(dialogueSync, worldId, worldFolderId);
}
