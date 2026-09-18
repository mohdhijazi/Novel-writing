import type { StoredRecord } from '@/lib/storage/collectionFile';

/** A place in a world, positioned on the world's map area. */
export interface Location extends StoredRecord {
  worldId: string;
  name: string;
  /** What kind of place it is: city, forest, tavern… */
  type: string;
  /** The wider region it sits in. */
  area: string;
  /** Position of the square's top-left corner within the map area, in pixels. */
  x: number;
  y: number;
  createdAt: string;
}

/** A location as stored in `locations.json`; the world is the folder it sits in. */
export type LocationDoc = Omit<Location, 'worldId'>;

/** The free-text fields of a location. */
export type LocationTextField = 'name' | 'type' | 'area';

/**
 * Fills in fields a location record does not have yet, so locations saved
 * before a field existed keep loading with it empty rather than undefined.
 */
const EMPTY_TEXT_FIELDS: Record<LocationTextField, string> = { name: '', type: '', area: '' };

export function normalizeLocation(record: Location): Location {
  return { ...EMPTY_TEXT_FIELDS, ...record };
}
