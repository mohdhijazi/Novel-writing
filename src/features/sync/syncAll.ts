import { syncCharactersForWorld } from '@/features/characters/syncCharacters';
import { syncConnectionsForWorld } from '@/features/locations/syncConnections';
import { syncLocationsForWorld } from '@/features/locations/syncLocations';
import { syncNovelsForWorld } from '@/features/novels/syncNovels';
import { syncWorlds } from '@/features/worlds/syncWorlds';

/** One full pass: worlds first, then the contents of each world. */
export async function syncAll(): Promise<void> {
  for (const world of await syncWorlds()) {
    await syncCharactersForWorld(world.worldId, world.driveFolderId);
    await syncLocationsForWorld(world.worldId, world.driveFolderId);
    await syncConnectionsForWorld(world.worldId, world.driveFolderId);
    await syncNovelsForWorld(world.worldId, world.driveFolderId);
  }
}
