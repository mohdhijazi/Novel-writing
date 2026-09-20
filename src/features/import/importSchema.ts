import { asArray, asRecord, asString, asWholeNumber } from '@/lib/json/readValues';

/**
 * The shape of a world import file. It is written by someone else's AI from a
 * story or notes, so parsing is forgiving: unknown keys are ignored, every
 * field except a name is optional, and anything unusable is reported as a
 * warning rather than failing the whole import.
 */
export const IMPORT_FORMAT = 'worlds-import';
export const IMPORT_VERSION = 1;

export interface ImportedCharacter {
  firstName: string;
  lastName: string;
  [field: string]: string;
}

export interface ImportedLocation {
  name: string;
  type: string;
  area: string;
  /** Names of other locations in this file. */
  connections: string[];
}

export interface ImportedEvent {
  name: string;
  details: string;
  year: number;
  /** A month name from this file's calendar, or empty. */
  month: string;
  /** 0 when the day is unknown. */
  day: number;
}

export interface ImportedCalendar {
  name: string;
  months: { name: string; days: number }[];
  weekdays: string[];
}

export interface ImportedWorld {
  worldName: string;
  calendar: ImportedCalendar | null;
  characters: ImportedCharacter[];
  locations: ImportedLocation[];
  events: ImportedEvent[];
  ideas: string[];
}

export interface ParseResult {
  world: ImportedWorld | null;
  /** Problems that stopped the file being read at all. */
  errors: string[];
  /** Records skipped or repaired; the rest of the import still runs. */
  warnings: string[];
}

function parseCharacters(value: unknown, warnings: string[]): ImportedCharacter[] {
  const characters: ImportedCharacter[] = [];
  for (const [index, entry] of asArray(value).entries()) {
    const record = asRecord(entry);
    if (!record) {
      warnings.push(`Character ${String(index + 1)} was not an object and was skipped.`);
      continue;
    }
    const character: ImportedCharacter = { firstName: '', lastName: '' };
    for (const [key, raw] of Object.entries(record)) {
      character[key] = asString(raw);
    }
    if (character.firstName === '' && character.lastName === '') {
      warnings.push(`Character ${String(index + 1)} had no name and was skipped.`);
      continue;
    }
    characters.push(character);
  }
  return characters;
}

function parseLocations(value: unknown, warnings: string[]): ImportedLocation[] {
  const locations: ImportedLocation[] = [];
  for (const [index, entry] of asArray(value).entries()) {
    const record = asRecord(entry);
    const name = asString(record?.name);
    if (!record || name === '') {
      warnings.push(`Location ${String(index + 1)} had no name and was skipped.`);
      continue;
    }
    locations.push({
      name,
      type: asString(record.type),
      area: asString(record.area),
      connections: asArray(record.connections)
        .map(asString)
        .filter((connection) => connection !== ''),
    });
  }
  return locations;
}

function parseEvents(value: unknown, warnings: string[]): ImportedEvent[] {
  const events: ImportedEvent[] = [];
  for (const [index, entry] of asArray(value).entries()) {
    const record = asRecord(entry);
    const name = asString(record?.name);
    if (!record || name === '') {
      warnings.push(`Event ${String(index + 1)} had no name and was skipped.`);
      continue;
    }
    const year = asWholeNumber(record.year);
    if (year === null) {
      warnings.push(`Event "${name}" had no usable year and was skipped.`);
      continue;
    }
    events.push({
      name,
      details: asString(record.details),
      year,
      month: asString(record.month),
      day: asWholeNumber(record.day) ?? 0,
    });
  }
  return events;
}

function parseCalendar(value: unknown, warnings: string[]): ImportedCalendar | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const months: { name: string; days: number }[] = [];
  for (const [index, entry] of asArray(record.months).entries()) {
    const month = asRecord(entry);
    const name = asString(month?.name);
    const days = asWholeNumber(month?.days);
    if (name === '' || days === null || days <= 0) {
      warnings.push(`Calendar month ${String(index + 1)} was incomplete and was skipped.`);
      continue;
    }
    months.push({ name, days });
  }
  const weekdays = asArray(record.weekdays)
    .map(asString)
    .filter((weekday) => weekday !== '');
  return { name: asString(record.name), months, weekdays };
}

/** Reads the text of an import file. Never throws: problems come back in the result. */
export function parseImportFile(text: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { world: null, errors: ['That file is not valid JSON.'], warnings };
  }

  const record = asRecord(data);
  if (!record) {
    return { world: null, errors: ['The file should contain a single JSON object.'], warnings };
  }
  if (asString(record.format) !== IMPORT_FORMAT) {
    errors.push(`The file is missing "format": "${IMPORT_FORMAT}".`);
  }
  const worldName = asString(asRecord(record.world)?.name);
  if (worldName === '') {
    errors.push('The file does not name a world.');
  }
  if (errors.length > 0) {
    return { world: null, errors, warnings };
  }

  return {
    world: {
      worldName,
      calendar: parseCalendar(record.calendar, warnings),
      characters: parseCharacters(record.characters, warnings),
      locations: parseLocations(record.locations, warnings),
      events: parseEvents(record.events, warnings),
      ideas: asArray(record.ideas)
        .map(asString)
        .filter((idea) => idea !== ''),
    },
    errors,
    warnings,
  };
}
