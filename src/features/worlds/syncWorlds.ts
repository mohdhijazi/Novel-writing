import { createWorldFolder, ensureRootFolder, listRemoteWorlds, writeWorldDoc } from './worldDrive';
import { listWorldRecords, mergeRemoteWorld, setDriveFolderId } from './worldsRepository';

export interface SyncedWorld {
  worldId: string;
  driveFolderId: string;
}

/**
 * Brings the world list on this device and in Drive together:
 * worlds found only in Drive are added locally, worlds created offline get
 * their folder, and differences are resolved by whichever side changed last.
 *
 * Returns each world with its Drive folder, so its contents can be synced next.
 */
export async function syncWorlds(): Promise<SyncedWorld[]> {
  const rootFolderId = await ensureRootFolder();
  const remoteWorlds = await listRemoteWorlds(rootFolderId);

  for (const remote of remoteWorlds) {
    await mergeRemoteWorld(remote.doc, remote.driveFolderId);
  }

  const remoteUpdatedAt = new Map(
    remoteWorlds.map((remote) => [remote.doc.id, remote.doc.updatedAt]),
  );

  const synced: SyncedWorld[] = [];
  for (const world of await listWorldRecords()) {
    let driveFolderId = world.driveFolderId;
    if (driveFolderId === null) {
      driveFolderId = await createWorldFolder(rootFolderId, world);
      await setDriveFolderId(world.id, driveFolderId);
    } else {
      const remoteTimestamp = remoteUpdatedAt.get(world.id);
      if (remoteTimestamp === undefined || world.updatedAt > remoteTimestamp) {
        await writeWorldDoc(world, driveFolderId);
      }
    }
    if (world.deletedAt === null) {
      synced.push({ worldId: world.id, driveFolderId });
    }
  }
  return synced;
}
