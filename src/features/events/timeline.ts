import type { CalendarMonth } from '@/features/calendar/types';

import type { WorldEvent } from './types';

/** A year before the calendar's zero point, shown the way a "BC" year is. */
function formatYear(year: number): string {
  return year < 0 ? `${String(Math.abs(year))} before` : String(year);
}

/**
 * Orders events oldest first, using the calendar's month order. Events with no
 * month come before dated ones inside the same year, since they are vaguer.
 */
export function sortEventsByDate(events: WorldEvent[], months: CalendarMonth[]): WorldEvent[] {
  const monthRank = new Map(months.map((month, index) => [month.id, index]));

  function rankOf(event: WorldEvent): number {
    if (event.monthId === '') {
      return -1;
    }
    // A month deleted from the calendar sorts last rather than disappearing.
    return monthRank.get(event.monthId) ?? Number.MAX_SAFE_INTEGER;
  }

  return events.slice().sort((a, b) => a.year - b.year || rankOf(a) - rankOf(b) || a.day - b.day);
}

/** The date as it reads on the timeline, e.g. "12 Frostwane, 118 before". */
export function formatEventDate(event: WorldEvent, months: CalendarMonth[]): string {
  const month = months.find((candidate) => candidate.id === event.monthId);
  if (!month) {
    return formatYear(event.year);
  }
  const monthName = month.name === '' ? 'Unnamed month' : month.name;
  const dayPart = event.day > 0 ? `${String(event.day)} ` : '';
  return `${dayPart}${monthName}, ${formatYear(event.year)}`;
}
