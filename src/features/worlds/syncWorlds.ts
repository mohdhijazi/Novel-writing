import { createWorldFolder, ensureRootFolder, listRemoteWorlds, writeWorldDoc } from './worldDrive';
import { listWorlds, mergeRemoteWorld, setDriveFolderId } from './worldsRepository';

/**
 * Brings the world list on this device and in Drive together:
 * worlds found only in Drive are added locally, worlds created offline get
 * their folder, and differences are resolved by whichever side changed last.
 */
export async function syncWorlds(): Promise<void> {
  const rootFolderId = await ensureRootFolder();
  const remoteWorlds = await listRemoteWorlds(rootFolderId);

  for (const remote of remoteWorlds) {
    await mergeRemoteWorld(remote.doc, remote.driveFolderId);
  }

  const remoteUpdatedAt = new Map(
    remoteWorlds.map((remote) => [remote.doc.id, remote.doc.updatedAt]),
  );

  for (const world of await listWorlds()) {
    if (world.driveFolderId === null) {
      const driveFolderId = await createWorldFolder(rootFolderId, world);
      await setDriveFolderId(world.id, driveFolderId);
      continue;
    }
    const remoteTimestamp = remoteUpdatedAt.get(world.id);
    if (remoteTimestamp === undefined || world.updatedAt > remoteTimestamp) {
      await writeWorldDoc(world, world.driveFolderId);
    }
  }
}
