import { syncNovelsForWorld } from '@/features/novels/syncNovels';
import { syncWorlds } from '@/features/worlds/syncWorlds';

/** One full pass: worlds first, then the contents of each world. */
export async function syncAll(): Promise<void> {
  for (const world of await syncWorlds()) {
    await syncNovelsForWorld(world.worldId, world.driveFolderId);
  }
}
