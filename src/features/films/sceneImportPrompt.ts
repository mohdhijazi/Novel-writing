import { SCENE_CLOSING_GROUPS, SCENE_SETUP_GROUPS } from './sceneFields';
import { SCENE_IMPORT_FORMAT, SCENE_IMPORT_VERSION } from './sceneImportSchema';
import { SHOT_TYPES } from './types';

/**
 * What each field is for, taken from the form's own labels so the prompt
 * cannot drift from the app. The label carries the guidance; everything before
 * the dash is just the field's name again, which the key already says.
 */
function fieldGuide(): string {
  return [...SCENE_SETUP_GROUPS, ...SCENE_CLOSING_GROUPS]
    .flatMap((group) => group.fields)
    .filter((field) => field.options === undefined)
    .map((field) => `  ${field.key} — ${field.label}`)
    .join('\n');
}

/**
 * The instructions a writer hands to whatever AI has read their chapter, so it
 * answers with JSON this app can turn into a scene.
 */
export function buildSceneImportPrompt(): string {
  return `You are turning a piece of a story into one scene of a film, ready for image and video generation.

Read the chapter or passage I give you and reply with ONE JSON object describing a single scene.

Rules:
- Reply with the JSON only — no explanation, no markdown fences, nothing else.
- Every field describes what a camera or a generated image would SHOW. Write visible movement and physical reaction, never feeling or intent: "his hand tightens around the cup", not "he feels anxious".
- Leave out descriptive narration; the pictures carry it.
- Use exactly the keys below. Use "" for anything the passage does not say.
- placement is "INT." for indoors or "EXT." for outdoors.
- Break the scene into shots. A generated clip runs about five seconds, so each shot is ONE clear moment, not a stretch of action. Three to eight shots suits most scenes.
- shotType is one of: ${SHOT_TYPES.join(', ')}. Use close framing sparingly, where it matters.
- camera is movement such as "slow push-in" or "pan"; leave it "" when the camera is still.
- Dialogue belongs to the shot it is said over. Put each line in that shot's "dialogue" list, in the order it is spoken.
- "line" is the spoken words only, with no stage direction inside it. "delivery" is a short note such as "quiet" or "sharp", and only when it is needed.

What the fields mean:
${fieldGuide()}

{
  "format": "${SCENE_IMPORT_FORMAT}",
  "version": ${String(SCENE_IMPORT_VERSION)},
  "scene": {
    "sceneCode": "Ep01_Ch1_Sc2",
    "title": "A few words to find it by",
    "placement": "INT.",
    "locationName": "Gregor's workshop",
    "timeOfDay": "Night",
    "charactersPresent": "Gregor, Ilse",
    "setting": "",
    "action": "",
    "mood": "",
    "sfx": "",
    "music": "",
    "newIdentities": "",
    "reusedAssets": "",
    "continuity": "",
    "shots": [
      {
        "shotType": "Medium",
        "camera": "",
        "visual": "The single image this shot should generate",
        "dialogue": [
          { "speaker": "GREGOR", "line": "It has to be tonight.", "delivery": "quiet" }
        ]
      }
    ]
  }
}

Do not include pictures or file names — pictures are chosen in the app afterwards.`;
}
