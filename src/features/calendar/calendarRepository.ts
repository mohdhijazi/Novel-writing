import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import { createEmptyCalendar } from './types';
import type { CalendarMonth, CalendarWeekday, WorldCalendar, WorldCalendarDoc } from './types';

export async function getCalendar(worldId: string): Promise<WorldCalendar | null> {
  const calendar = await db.calendars.get(worldId);
  return calendar?.deletedAt === null ? calendar : null;
}

/** The world's calendar, deleted ones included — sync needs the tombstone. */
export async function listCalendarRecords(worldId: string): Promise<WorldCalendar[]> {
  return db.calendars.where('worldId').equals(worldId).toArray();
}

/**
 * Reads the calendar, applies a change and writes it back, creating it if
 * needed. The whole record is rewritten each time, so this runs in a
 * transaction — two edits landing together would otherwise read the same
 * starting point and the second would erase the first.
 */
async function updateCalendar(
  worldId: string,
  change: (calendar: WorldCalendar) => WorldCalendar,
): Promise<void> {
  await db.transaction('rw', db.calendars, async () => {
    const existing = await db.calendars.get(worldId);
    const base = existing ?? createEmptyCalendar(worldId);
    await db.calendars.put({ ...change(base), updatedAt: new Date().toISOString() });
  });
}

function updateById<T extends { id: string }>(items: T[], id: string, patch: Partial<T>): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((item) => item.id !== id);
}

/** Moves an entry one place earlier (-1) or later (+1); ends stay put. */
function moveById<T extends { id: string }>(items: T[], id: string, offset: number): T[] {
  const index = items.findIndex((item) => item.id === id);
  const target = index + offset;
  const item = items[index];
  if (index === -1 || item === undefined || target < 0 || target >= items.length) {
    return items;
  }
  const reordered = removeById(items, id);
  reordered.splice(target, 0, item);
  return reordered;
}

export async function setCalendarName(worldId: string, name: string): Promise<void> {
  await updateCalendar(worldId, (calendar) => ({ ...calendar, name }));
}

export async function addMonth(worldId: string, name: string, days: number): Promise<void> {
  const month: CalendarMonth = { id: crypto.randomUUID(), name, days };
  await updateCalendar(worldId, (calendar) => ({
    ...calendar,
    months: [...calendar.months, month],
  }));
}

export async function updateMonth(
  worldId: string,
  monthId: string,
  patch: Partial<Omit<CalendarMonth, 'id'>>,
): Promise<void> {
  await updateCalendar(worldId, (calendar) => ({
    ...calendar,
    months: updateById<CalendarMonth>(calendar.months, monthId, patch),
  }));
}

export async function removeMonth(worldId: string, monthId: string): Promise<void> {
  await updateCalendar(worldId, (calendar) => ({
    ...calendar,
    months: removeById(calendar.months, monthId),
  }));
}

export async function moveMonth(worldId: string, monthId: string, offset: number): Promise<void> {
  await updateCalendar(worldId, (calendar) => ({
    ...calendar,
    months: moveById(calendar.months, monthId, offset),
  }));
}

export async function addWeekday(worldId: string, name: string): Promise<void> {
  const weekday: CalendarWeekday = { id: crypto.randomUUID(), name };
  await updateCalendar(worldId, (calendar) => ({
    ...calendar,
    weekdays: [...calendar.weekdays, weekday],
  }));
}

export async function renameWeekday(
  worldId: string,
  weekdayId: string,
  name: string,
): Promise<void> {
  await updateCalendar(worldId, (calendar) => ({
    ...calendar,
    weekdays: updateById<CalendarWeekday>(calendar.weekdays, weekdayId, { name }),
  }));
}

export async function removeWeekday(worldId: string, weekdayId: string): Promise<void> {
  await updateCalendar(worldId, (calendar) => ({
    ...calendar,
    weekdays: removeById(calendar.weekdays, weekdayId),
  }));
}

export async function moveWeekday(
  worldId: string,
  weekdayId: string,
  offset: number,
): Promise<void> {
  await updateCalendar(worldId, (calendar) => ({
    ...calendar,
    weekdays: moveById(calendar.weekdays, weekdayId, offset),
  }));
}

/** Applies the calendar from Drive; returns whether the local side holds more. */
export async function mergeRemoteCalendar(
  worldId: string,
  docs: WorldCalendarDoc[],
): Promise<boolean> {
  const local = await listCalendarRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) => ({ ...doc, worldId }));
  if (toStore.length > 0) {
    await db.calendars.bulkPut(toStore);
  }
  return localIsAhead;
}
