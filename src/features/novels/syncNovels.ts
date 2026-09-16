import { createNovelFolder, ensureRootFolder, listRemoteNovels, writeNovelDoc } from './novelDrive';
import { listNovels, mergeRemoteNovel, setDriveFolderId } from './novelsRepository';

/**
 * Brings the novel list on this device and in Drive together:
 * novels found only in Drive are added locally, novels created offline get
 * their folder, and differences are resolved by whichever side changed last.
 */
export async function syncNovels(): Promise<void> {
  const rootFolderId = await ensureRootFolder();
  const remoteNovels = await listRemoteNovels(rootFolderId);

  for (const remote of remoteNovels) {
    await mergeRemoteNovel(remote.doc, remote.driveFolderId);
  }

  const remoteUpdatedAt = new Map(
    remoteNovels.map((remote) => [remote.doc.id, remote.doc.updatedAt]),
  );

  for (const novel of await listNovels()) {
    if (novel.driveFolderId === null) {
      const driveFolderId = await createNovelFolder(rootFolderId, novel);
      await setDriveFolderId(novel.id, driveFolderId);
      continue;
    }
    const remoteTimestamp = remoteUpdatedAt.get(novel.id);
    if (remoteTimestamp === undefined || novel.updatedAt > remoteTimestamp) {
      await writeNovelDoc(novel, novel.driveFolderId);
    }
  }
}
