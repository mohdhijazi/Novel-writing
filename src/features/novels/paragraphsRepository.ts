import { db } from '@/lib/db/database';

import type { Paragraph, ParagraphDoc } from './types';

/** Space left between order values so a paragraph can be inserted between two others. */
const ORDER_STEP = 1000;

export async function listParagraphs(chapterId: string): Promise<Paragraph[]> {
  const paragraphs = await listParagraphRecords(chapterId);
  return paragraphs
    .filter((paragraph) => paragraph.deletedAt === null)
    .sort((a, b) => a.order - b.order);
}

/** Every paragraph of a chapter, deleted ones included — sync needs the tombstones. */
export async function listParagraphRecords(chapterId: string): Promise<Paragraph[]> {
  return db.paragraphs.where('chapterId').equals(chapterId).toArray();
}

/**
 * Runs a local paragraph write and counts it on the chapter, so sync knows this
 * device has something to upload.
 */
async function writeParagraphs(chapterId: string, write: () => Promise<unknown>): Promise<void> {
  await db.transaction('rw', db.paragraphs, db.chapters, async () => {
    await write();
    const chapter = await db.chapters.get(chapterId);
    if (chapter) {
      await db.chapters.update(chapterId, { paragraphsRevision: chapter.paragraphsRevision + 1 });
    }
  });
}

/** Adds an empty paragraph at the end of the chapter. */
export async function appendParagraph(chapterId: string): Promise<Paragraph> {
  const existing = await listParagraphs(chapterId);
  const lastOrder = existing.at(-1)?.order ?? 0;
  const timestamp = new Date().toISOString();
  const paragraph: Paragraph = {
    id: crypto.randomUUID(),
    chapterId,
    order: lastOrder + ORDER_STEP,
    text: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  await writeParagraphs(chapterId, () => db.paragraphs.add(paragraph));
  return paragraph;
}

export async function saveParagraphText(id: string, text: string): Promise<void> {
  const paragraph = await db.paragraphs.get(id);
  if (!paragraph) {
    return;
  }
  await writeParagraphs(paragraph.chapterId, () =>
    db.paragraphs.update(id, { text, updatedAt: new Date().toISOString() }),
  );
}

export async function deleteParagraph(id: string): Promise<void> {
  const paragraph = await db.paragraphs.get(id);
  if (!paragraph) {
    return;
  }
  const timestamp = new Date().toISOString();
  await writeParagraphs(paragraph.chapterId, () =>
    db.paragraphs.update(id, { deletedAt: timestamp, updatedAt: timestamp }),
  );
}

/**
 * Merges the paragraphs from Drive into the local ones, newest `updatedAt`
 * winning per paragraph. Returns true when the local side holds something the
 * Drive copy does not, meaning the merged file has to be uploaded.
 */
export async function mergeRemoteParagraphs(
  chapterId: string,
  docs: ParagraphDoc[],
): Promise<boolean> {
  const local = await listParagraphRecords(chapterId);
  const localById = new Map(local.map((paragraph) => [paragraph.id, paragraph]));
  const toStore: Paragraph[] = [];
  let localIsAhead = false;

  for (const doc of docs) {
    const existing = localById.get(doc.id);
    if (existing && existing.updatedAt >= doc.updatedAt) {
      if (existing.updatedAt > doc.updatedAt) {
        localIsAhead = true;
      }
      continue;
    }
    toStore.push({ ...doc, chapterId });
  }

  const remoteIds = new Set(docs.map((doc) => doc.id));
  if (local.some((paragraph) => !remoteIds.has(paragraph.id))) {
    localIsAhead = true;
  }

  if (toStore.length > 0) {
    // Not counted as a local write: this is Drive's content coming in.
    await db.paragraphs.bulkPut(toStore);
  }
  return localIsAhead;
}
