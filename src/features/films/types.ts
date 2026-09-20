import type { StoredRecord } from '@/lib/storage/collectionFile';

/**
 * Film, episode, scene, shot and dialogue are flat collections rather than
 * nested folders, the way relations, tickets and links are: each record names
 * its parent, so one file per kind syncs the whole hierarchy.
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

/**
 * A scene, written the way the scene template asks for: everything is what a
 * camera would see, not what anyone feels or means. Its shots are records of
 * their own, and each line of dialogue belongs to the shot it plays over.
 */
export interface Scene extends StoredRecord {
  worldId: string;
  episodeId: string;
  /** Position in the episode. */
  number: number;
  title: string;
  /** Tracking id across the pipeline, e.g. Ep01_Ch2_Sc3. */
  sceneCode: string;
  /** INT. or EXT. */
  placement: string;
  locationName: string;
  timeOfDay: string;
  /** Names only; who they are is kept on the characters themselves. */
  charactersPresent: string;
  setting: string;
  action: string;
  mood: string;
  sfx: string;
  music: string;
  newIdentities: string;
  reusedAssets: string;
  continuity: string;
  createdAt: string;
}

/** One image the scene is built from — a clip is short, so a scene is many. */
export interface Shot extends StoredRecord {
  worldId: string;
  sceneId: string;
  /** Position within the scene. */
  number: number;
  shotType: string;
  visual: string;
  camera: string;
  createdAt: string;
}

/** A line said during one shot. It belongs to that shot, not to the scene. */
export interface DialogueLine extends StoredRecord {
  worldId: string;
  shotId: string;
  /** Sort key within the shot. */
  order: number;
  speaker: string;
  /** The line itself, with no stage direction in it. */
  line: string;
  delivery: string;
  createdAt: string;
}

export type FilmDoc = Omit<Film, 'worldId'>;
export type EpisodeDoc = Omit<Episode, 'worldId'>;
export type SceneDoc = Omit<Scene, 'worldId'>;
export type ShotDoc = Omit<Shot, 'worldId'>;
export type DialogueLineDoc = Omit<DialogueLine, 'worldId'>;

/** The free-text fields of a scene, i.e. everything but its own plumbing. */
export type SceneTextField = Exclude<
  keyof Scene,
  'id' | 'worldId' | 'episodeId' | 'number' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

/** Where a scene sits relative to the walls. */
export const SCENE_PLACEMENTS = ['INT.', 'EXT.'] as const;

/** Used sparingly — only when the shot matters. */
export const SHOT_TYPES = ['Wide', 'Medium', 'Close-up', 'Over-the-shoulder', 'Insert'] as const;

const EMPTY_SCENE_FIELDS: Record<SceneTextField, string> = {
  title: '',
  sceneCode: '',
  placement: 'INT.',
  locationName: '',
  timeOfDay: '',
  charactersPresent: '',
  setting: '',
  action: '',
  mood: '',
  sfx: '',
  music: '',
  newIdentities: '',
  reusedAssets: '',
  continuity: '',
};

export const SCENE_TEXT_FIELDS = Object.keys(EMPTY_SCENE_FIELDS) as SceneTextField[];

/**
 * Fills in fields a scene does not have yet. Scenes written before a field
 * existed — here or in someone's Drive — must keep loading, so every read goes
 * through this.
 */
export function normalizeScene(record: Scene): Scene {
  return { ...EMPTY_SCENE_FIELDS, ...record };
}

/**
 * "INT. GREGOR'S WORKSHOP — NIGHT", as the template heads a scene. Empty until
 * there is a location to name — "INT." on its own says nothing.
 */
export function sceneSlugline(scene: Scene): string {
  if (scene.locationName === '') {
    return '';
  }
  const place = [scene.placement, scene.locationName].filter((part) => part !== '').join(' ');
  return [place, scene.timeOfDay].filter((part) => part !== '').join(' — ');
}
