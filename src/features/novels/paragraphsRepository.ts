import { db } from '@/lib/db/database';

import type { Paragraph } from './types';

/** Space left between order values so a paragraph can be inserted between two others. */
const ORDER_STEP = 1000;

export async function listParagraphs(chapterId: string): Promise<Paragraph[]> {
  const paragraphs = await db.paragraphs.where('chapterId').equals(chapterId).toArray();
  return paragraphs
    .filter((paragraph) => paragraph.deletedAt === null)
    .sort((a, b) => a.order - b.order);
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
  await db.paragraphs.add(paragraph);
  return paragraph;
}

export async function saveParagraphText(id: string, text: string): Promise<void> {
  await db.paragraphs.update(id, { text, updatedAt: new Date().toISOString() });
}

export async function deleteParagraph(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.paragraphs.update(id, { deletedAt: timestamp, updatedAt: timestamp });
}
