import { getTrashState, trashFile } from '@/lib/google/driveApi';

import { createWorldFolder, ensureRootFolder, listRemoteWorlds, writeWorldDoc } from './worldDrive';
import {
  deleteWorld,
  forgetDriveFolder,
  listWorldRecords,
  mergeRemoteWorld,
  setDriveFolderId,
} from './worldsRepository';

export interface SyncedWorld {
  worldId: string;
  driveFolderId: string;
}

/**
 * Brings the world list on this device and in Drive together:
 * worlds found only in Drive are added locally, worlds created offline get
 * their folder, worlds deleted here have their Drive folder binned, and
 * differences are resolved by whichever side changed last.
 *
 * Returns each live world with its Drive folder, so its contents sync next.
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
  const foldersUnderRoot = new Set(remoteWorlds.map((remote) => remote.driveFolderId));

  const synced: SyncedWorld[] = [];
  for (const world of await listWorldRecords()) {
    if (world.deletedAt !== null) {
      if (world.driveFolderId !== null) {
        await trashFile(world.driveFolderId);
        await forgetDriveFolder(world.id);
      }
      continue;
    }

    let driveFolderId = world.driveFolderId;
    if (driveFolderId === null) {
      driveFolderId = await createWorldFolder(rootFolderId, world);
      await setDriveFolderId(world.id, driveFolderId);
    } else if (!foldersUnderRoot.has(driveFolderId)) {
      // The folder is no longer where we left it: binned on the other device,
      // or simply moved elsewhere in Drive, which is allowed.
      const state = await getTrashState(driveFolderId);
      if (state === null || state.trashed) {
        await deleteWorld(world.id);
        await forgetDriveFolder(world.id);
        continue;
      }
      await writeWorldDoc(world, driveFolderId);
    } else {
      const remoteTimestamp = remoteUpdatedAt.get(world.id);
      if (remoteTimestamp === undefined || world.updatedAt > remoteTimestamp) {
        await writeWorldDoc(world, driveFolderId);
      }
    }

    synced.push({ worldId: world.id, driveFolderId });
  }
  return synced;
}
