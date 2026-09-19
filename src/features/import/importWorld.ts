import {
  addMonth,
  addWeekday,
  getCalendar,
  setCalendarName,
} from '@/features/calendar/calendarRepository';
import { addImportedCharacters } from '@/features/characters/charactersRepository';
import { addImportedEvents } from '@/features/events/eventsRepository';
import { addImportedIdeas } from '@/features/ideas/ideasRepository';
import { addImportedConnections } from '@/features/locations/connectionsRepository';
import { addImportedLocations } from '@/features/locations/locationsRepository';
import { positionForNewLocation } from '@/features/locations/mapLayout';
import { createWorld } from '@/features/worlds/worldsRepository';

import type { ImportedWorld } from './importSchema';

export interface ImportOutcome {
  worldId: string;
  counts: {
    characters: number;
    locations: number;
    connections: number;
    events: number;
    ideas: number;
  };
  warnings: string[];
}

/** Writes a parsed import file into a brand-new world. */
export async function importWorld(world: ImportedWorld): Promise<ImportOutcome> {
  const warnings: string[] = [];
  const created = await createWorld(world.worldName);

  if (world.calendar) {
    await setCalendarName(created.id, world.calendar.name);
    for (const month of world.calendar.months) {
      await addMonth(created.id, month.name, month.days);
    }
    for (const weekday of world.calendar.weekdays) {
      await addWeekday(created.id, weekday);
    }
  }

  await addImportedCharacters(created.id, world.characters);

  const locationIds = await addImportedLocations(
    created.id,
    world.locations.map((location, index) => ({
      name: location.name,
      type: location.type,
      area: location.area,
      ...positionForNewLocation(index),
    })),
  );

  // Connections arrive as names; keep each pair once, in either direction.
  const seen = new Set<string>();
  const pairs: { fromId: string; toId: string }[] = [];
  for (const location of world.locations) {
    const fromId = locationIds.get(location.name);
    for (const otherName of location.connections) {
      const toId = locationIds.get(otherName);
      if (fromId === undefined || toId === undefined) {
        warnings.push(`"${location.name}" is linked to "${otherName}", which is not in the file.`);
        continue;
      }
      const key = [fromId, toId].sort().join('|');
      if (fromId === toId || seen.has(key)) {
        continue;
      }
      seen.add(key);
      pairs.push({ fromId, toId });
    }
  }
  await addImportedConnections(created.id, pairs);

  // Events name their month; match it against the calendar just imported.
  const calendar = await getCalendar(created.id);
  const monthIds = new Map(
    (calendar?.months ?? []).map((month) => [month.name.toLowerCase(), month.id]),
  );
  await addImportedEvents(
    created.id,
    world.events.map((event) => {
      const monthId = event.month === '' ? '' : (monthIds.get(event.month.toLowerCase()) ?? '');
      if (event.month !== '' && monthId === '') {
        warnings.push(
          `"${event.name}" names the month "${event.month}", which is not in the calendar.`,
        );
      }
      return {
        name: event.name,
        details: event.details,
        year: event.year,
        monthId,
        day: monthId === '' ? 0 : event.day,
      };
    }),
  );

  await addImportedIdeas(created.id, world.ideas);

  return {
    worldId: created.id,
    counts: {
      characters: world.characters.length,
      locations: world.locations.length,
      connections: pairs.length,
      events: world.events.length,
      ideas: world.ideas.length,
    },
    warnings,
  };
}
