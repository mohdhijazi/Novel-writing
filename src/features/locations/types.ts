import type { StoredRecord } from '@/lib/storage/collectionFile';

/** A place in a world, positioned on the world's map area. */
export interface Location extends StoredRecord {
  worldId: string;
  name: string;
  /** Position of the square's top-left corner within the map area, in pixels. */
  x: number;
  y: number;
  createdAt: string;
}

/** A location as stored in `locations.json`; the world is the folder it sits in. */
export type LocationDoc = Omit<Location, 'worldId'>;
