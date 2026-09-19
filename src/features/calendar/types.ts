import type { StoredRecord } from '@/lib/storage/collectionFile';

export interface CalendarMonth {
  id: string;
  name: string;
  /** How many days this month runs for. */
  days: number;
}

export interface CalendarWeekday {
  id: string;
  name: string;
}

/**
 * A world's calendar. One per world, so its id is the world's id — that keeps
 * the two devices merging the same record rather than creating one each.
 * Month and weekday order is the array order.
 */
export interface WorldCalendar extends StoredRecord {
  worldId: string;
  name: string;
  months: CalendarMonth[];
  weekdays: CalendarWeekday[];
  createdAt: string;
}

/** A calendar as stored in `calendar.json`. */
export type WorldCalendarDoc = Omit<WorldCalendar, 'worldId'>;

export function createEmptyCalendar(worldId: string): WorldCalendar {
  const timestamp = new Date().toISOString();
  return {
    id: worldId,
    worldId,
    name: '',
    months: [],
    weekdays: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
}

export function daysInYear(calendar: WorldCalendar | null): number {
  return (calendar?.months ?? []).reduce((total, month) => total + month.days, 0);
}
