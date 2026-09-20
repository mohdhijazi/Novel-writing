import { asArray, asRecord, asString } from '@/lib/json/readValues';

import { SCENE_PLACEMENTS, SCENE_TEXT_FIELDS, SHOT_TYPES } from './types';
import type { SceneTextField } from './types';

/**
 * The shape of a pasted scene. It is written by whatever AI read the chapter,
 * so reading it is forgiving: unknown keys are ignored, every field is
 * optional, and anything unusable becomes a warning rather than a refusal.
 * Pictures are not in it — they are chosen in the app, not written by an AI.
 */
export const SCENE_IMPORT_FORMAT = 'worlds-scene';
export const SCENE_IMPORT_VERSION = 1;

export interface ImportedDialogueLine {
  speaker: string;
  line: string;
  delivery: string;
}

export interface ImportedShot {
  shotType: string;
  visual: string;
  camera: string;
  dialogue: ImportedDialogueLine[];
}

export interface ImportedScene {
  fields: Partial<Record<SceneTextField, string>>;
  shots: ImportedShot[];
}

export interface SceneParseResult {
  scene: ImportedScene | null;
  /** Problems that stopped the text being read at all. */
  errors: string[];
  /** Things skipped or repaired; the rest is still added. */
  warnings: string[];
}

/** INT. or EXT., however the AI happened to write it. */
function parsePlacement(value: unknown, warnings: string[]): string | undefined {
  const raw = asString(value);
  if (raw === '') {
    return undefined;
  }
  // "INT", "int.", "Interior" and "INTERIOR" all start the same way.
  const letters = raw
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3);
  const match =
    letters === ''
      ? undefined
      : SCENE_PLACEMENTS.find((placement) => placement.startsWith(letters));
  if (match !== undefined) {
    return match;
  }
  warnings.push(`"${raw}" is not INT. or EXT., so the scene was left as INT.`);
  return undefined;
}

/** Matched against the app's own shot types, whatever case it arrived in. */
function parseShotType(value: unknown, position: number, warnings: string[]): string {
  const raw = asString(value);
  if (raw === '') {
    return '';
  }
  const match = SHOT_TYPES.find((type) => type.toLowerCase() === raw.toLowerCase());
  if (match !== undefined) {
    return match;
  }
  warnings.push(
    `Shot ${String(position)} has an unusual shot type, "${raw}"; it was kept as it is.`,
  );
  return raw;
}

function parseDialogue(
  value: unknown,
  position: number,
  warnings: string[],
): ImportedDialogueLine[] {
  const lines: ImportedDialogueLine[] = [];
  for (const [index, entry] of asArray(value).entries()) {
    const record = asRecord(entry);
    const line = asString(record?.line);
    const speaker = asString(record?.speaker);
    if (!record || (line === '' && speaker === '')) {
      warnings.push(
        `Line ${String(index + 1)} of shot ${String(position)} had no speaker or words and was skipped.`,
      );
      continue;
    }
    lines.push({ speaker, line, delivery: asString(record.delivery) });
  }
  return lines;
}

function parseShots(value: unknown, warnings: string[]): ImportedShot[] {
  const shots: ImportedShot[] = [];
  for (const [index, entry] of asArray(value).entries()) {
    const position = index + 1;
    const record = asRecord(entry);
    if (!record) {
      warnings.push(`Shot ${String(position)} was not an object and was skipped.`);
      continue;
    }
    shots.push({
      shotType: parseShotType(record.shotType, position, warnings),
      visual: asString(record.visual),
      camera: asString(record.camera),
      dialogue: parseDialogue(record.dialogue, position, warnings),
    });
  }
  return shots;
}

/**
 * Reads pasted text. Never throws: problems come back in the result.
 *
 * The wrapper is optional — an AI that answers with the bare scene object, or
 * leaves out `format`, is still understood. Only text that holds nothing this
 * app recognises is refused.
 */
export function parseSceneJson(text: string): SceneParseResult {
  const warnings: string[] = [];

  if (text.trim() === '') {
    return { scene: null, errors: ['Paste the JSON first.'], warnings };
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { scene: null, errors: ['That is not valid JSON.'], warnings };
  }

  const record = asRecord(data);
  if (!record) {
    return { scene: null, errors: ['The text should hold a single JSON object.'], warnings };
  }

  const format = asString(record.format);
  if (format !== '' && format !== SCENE_IMPORT_FORMAT) {
    return {
      scene: null,
      errors: [`This looks like a "${format}" file rather than a scene.`],
      warnings,
    };
  }

  const body = asRecord(record.scene) ?? record;
  const fields: Partial<Record<SceneTextField, string>> = {};
  for (const field of SCENE_TEXT_FIELDS) {
    if (field === 'placement') {
      continue;
    }
    const value = asString(body[field]);
    if (value !== '') {
      fields[field] = value;
    }
  }
  const placement = parsePlacement(body.placement, warnings);
  if (placement !== undefined) {
    fields.placement = placement;
  }

  const shots = parseShots(body.shots, warnings);
  if (Object.keys(fields).length === 0 && shots.length === 0) {
    return {
      scene: null,
      errors: ['That JSON holds no scene fields and no shots.'],
      warnings,
    };
  }
  if (format === '') {
    warnings.push(
      `The JSON did not say "format": "${SCENE_IMPORT_FORMAT}"; it was read as a scene.`,
    );
  }

  return { scene: { fields, shots }, errors: [], warnings };
}
