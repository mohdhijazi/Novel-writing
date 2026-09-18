import type { StoredRecord } from '@/lib/storage/collectionFile';

/**
 * Something that happened in a world. Named `WorldEvent` so it cannot be
 * confused with the browser's own Event type.
 *
 * The date uses the world's own calendar: `year` may be negative for dates
 * before the calendar's zero point, `monthId` points at a month of that
 * calendar, and both month and day are optional for a date that is only known
 * roughly. Empty string and 0 mean "not set".
 */
export interface WorldEvent extends StoredRecord {
  worldId: string;
  name: string;
  details: string;
  year: number;
  monthId: string;
  day: number;
  createdAt: string;
}

/** An event as stored in `events.json`; the world is the folder it sits in. */
export type WorldEventDoc = Omit<WorldEvent, 'worldId'>;

const EMPTY_FIELDS = { name: '', details: '', year: 0, monthId: '', day: 0 };

/** Fills in fields an event record does not have yet. */
export function normalizeEvent(record: WorldEvent): WorldEvent {
  return { ...EMPTY_FIELDS, ...record };
}
