import type { SceneTextField } from './types';
import { SCENE_PLACEMENTS } from './types';

export interface SceneFieldDefinition {
  key: SceneTextField;
  label: string;
  /** Offered as a menu of these values rather than a free text box. */
  options?: readonly string[];
  /** Rendered as a textarea rather than a single-line input. */
  multiline?: boolean;
}

export interface SceneFieldGroup {
  title: string;
  /** One line under the title, where the template asks for a particular kind of answer. */
  note?: string;
  fields: SceneFieldDefinition[];
}

/**
 * The scene form, from the scene template. Adding a field is one entry here
 * plus the type — the same arrangement the character form uses.
 */

/** Shown above the shot breakdown and the dialogue. */
export const SCENE_SETUP_GROUPS: SceneFieldGroup[] = [
  {
    title: 'Scene header',
    fields: [
      { key: 'sceneCode', label: 'Scene ID' },
      { key: 'title', label: 'Title — for finding it in the list' },
      { key: 'placement', label: 'Inside or out', options: SCENE_PLACEMENTS },
      { key: 'locationName', label: 'Location' },
      { key: 'timeOfDay', label: 'Time of day' },
      { key: 'charactersPresent', label: 'Characters present — names only', multiline: true },
    ],
  },
  {
    title: 'Visual description',
    note: 'What a camera would show, not what anyone feels or means.',
    fields: [
      {
        key: 'setting',
        label: 'Setting — 2–3 visual anchors, only what is new here',
        multiline: true,
      },
      {
        key: 'action',
        label: 'Action — visible movement, e.g. "his hand tightens around the cup"',
        multiline: true,
      },
      {
        key: 'mood',
        label: 'Mood or style — one line to steer the image, e.g. "tense, low light"',
        multiline: true,
      },
    ],
  },
];

/** Shown below them. */
export const SCENE_CLOSING_GROUPS: SceneFieldGroup[] = [
  {
    title: 'Sound',
    fields: [
      {
        key: 'sfx',
        label: 'SFX cues — name the shot, e.g. "door slams — shot 3"',
        multiline: true,
      },
      { key: 'music', label: 'Music or OST note — mood only', multiline: true },
    ],
  },
  {
    title: 'Production notes',
    fields: [
      {
        key: 'newIdentities',
        label: 'New identities needed — anyone or anywhere appearing for the first time',
        multiline: true,
      },
      {
        key: 'reusedAssets',
        label: 'Reused assets — backgrounds or shots an earlier scene already has',
        multiline: true,
      },
      {
        key: 'continuity',
        label: 'Continuity — what must match earlier scenes',
        multiline: true,
      },
    ],
  },
];
