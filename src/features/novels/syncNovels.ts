import {
  createChapterFolder,
  createNovelFolder,
  downloadParagraphsFile,
  ensureNovelsFolder,
  findParagraphsFile,
  listChapterFolders,
  listNovelFolders,
  readChapterDoc,
  readNovelDoc,
  writeChapterDoc,
  writeNovelDoc,
  writeParagraphsFile,
} from './novelDrive';
import {
  listChapterRecords,
  mergeRemoteChapter,
  setChapterDriveFolderId,
  setChapterParagraphsSync,
} from './chaptersRepository';
import { listNovelRecords, mergeRemoteNovel, setNovelDriveFolderId } from './novelsRepository';
import { listParagraphRecords, mergeRemoteParagraphs } from './paragraphsRepository';
import type { Chapter } from './types';

/** Syncs every novel of one world: its chapters and their paragraphs. */
export async function syncNovelsForWorld(worldId: string, worldFolderId: string): Promise<void> {
  const novelsFolderId = await ensureNovelsFolder(worldFolderId);
  const remoteUpdatedAt = new Map<string, string>();

  for (const folder of await listNovelFolders(novelsFolderId)) {
    const doc = await readNovelDoc(folder.id);
    if (doc) {
      await mergeRemoteNovel(doc, folder.id);
      remoteUpdatedAt.set(doc.id, doc.updatedAt);
    }
  }

  for (const novel of await listNovelRecords(worldId)) {
    let folderId = novel.driveFolderId;
    if (folderId === null) {
      folderId = await createNovelFolder(novelsFolderId, novel);
      await setNovelDriveFolderId(novel.id, folderId);
    } else {
      const remoteTimestamp = remoteUpdatedAt.get(novel.id);
      if (remoteTimestamp === undefined || novel.updatedAt > remoteTimestamp) {
        await writeNovelDoc(novel, folderId);
      }
    }
    await syncChapters(novel.id, folderId);
  }
}

async function syncChapters(novelId: string, novelFolderId: string): Promise<void> {
  const remoteUpdatedAt = new Map<string, string>();

  for (const folder of await listChapterFolders(novelFolderId)) {
    const doc = await readChapterDoc(folder.id);
    if (doc) {
      await mergeRemoteChapter(doc, folder.id);
      remoteUpdatedAt.set(doc.id, doc.updatedAt);
    }
  }

  for (const chapter of await listChapterRecords(novelId)) {
    let folderId = chapter.driveFolderId;
    if (folderId === null) {
      folderId = await createChapterFolder(novelFolderId, chapter);
      await setChapterDriveFolderId(chapter.id, folderId);
    } else {
      const remoteTimestamp = remoteUpdatedAt.get(chapter.id);
      if (remoteTimestamp === undefined || chapter.updatedAt > remoteTimestamp) {
        await writeChapterDoc(chapter, folderId);
      }
    }
    await syncParagraphs(chapter, folderId);
  }
}

/**
 * Merges one chapter's paragraphs with Drive. Downloads only when Drive's copy
 * changed since the last merge, and uploads only when this device has written
 * something since its last upload.
 */
async function syncParagraphs(chapter: Chapter, chapterFolderId: string): Promise<void> {
  const file = await findParagraphsFile(chapterFolderId);
  const revision = chapter.paragraphsRevision;

  if (!file) {
    const localRecords = await listParagraphRecords(chapter.id);
    if (localRecords.length === 0) {
      return;
    }
    const created = await writeParagraphsFile(chapterFolderId, null, chapter.id, localRecords);
    await setChapterParagraphsSync(chapter.id, created.id, created.modifiedTime, revision);
    return;
  }

  const remoteChanged = file.modifiedTime !== chapter.driveParagraphsModifiedTime;
  const localChanged = revision !== chapter.paragraphsSyncedRevision;

  if (!remoteChanged && !localChanged) {
    return;
  }

  let uploadNeeded = localChanged;
  if (remoteChanged) {
    const content = await downloadParagraphsFile(file.id);
    const localIsAhead = await mergeRemoteParagraphs(chapter.id, content.paragraphs);
    uploadNeeded = uploadNeeded || localIsAhead;
  }

  if (!uploadNeeded) {
    await setChapterParagraphsSync(chapter.id, file.id, file.modifiedTime, revision);
    return;
  }

  const merged = await listParagraphRecords(chapter.id);
  const uploaded = await writeParagraphsFile(chapterFolderId, file.id, chapter.id, merged);
  // Writes made during the upload raise the revision past this one, so the next
  // sync uploads again rather than losing them.
  await setChapterParagraphsSync(chapter.id, uploaded.id, uploaded.modifiedTime, revision);
}
