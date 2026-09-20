import { syncCalendarForWorld } from '@/features/calendar/syncCalendar';
import { syncCharactersForWorld } from '@/features/characters/syncCharacters';
import { syncEventsForWorld } from '@/features/events/syncEvents';
import { syncFilmsForWorld } from '@/features/films/syncFilms';
import { syncImagesForWorld } from '@/features/images/syncImages';
import { syncConnectionsForWorld } from '@/features/locations/syncConnections';
import { syncIdeasForWorld } from '@/features/ideas/syncIdeas';
import { syncLocationsForWorld } from '@/features/locations/syncLocations';
import { syncNovelsForWorld } from '@/features/novels/syncNovels';
import { syncRelationsForWorld } from '@/features/relations/syncRelations';
import { syncWorlds } from '@/features/worlds/syncWorlds';

/** One full pass: worlds first, then the contents of each world. */
export async function syncAll(): Promise<void> {
  for (const world of await syncWorlds()) {
    await syncCalendarForWorld(world.worldId, world.driveFolderId);
    await syncCharactersForWorld(world.worldId, world.driveFolderId);
    await syncEventsForWorld(world.worldId, world.driveFolderId);
    await syncIdeasForWorld(world.worldId, world.driveFolderId);
    await syncLocationsForWorld(world.worldId, world.driveFolderId);
    await syncConnectionsForWorld(world.worldId, world.driveFolderId);
    await syncRelationsForWorld(world.worldId, world.driveFolderId);
    await syncImagesForWorld(world.worldId, world.driveFolderId);
    await syncNovelsForWorld(world.worldId, world.driveFolderId);
    await syncFilmsForWorld(world.worldId, world.driveFolderId);
  }
}
