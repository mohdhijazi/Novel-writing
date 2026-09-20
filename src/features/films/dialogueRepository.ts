import { db } from '@/lib/db/database';
import { mergeByUpdatedAt } from '@/lib/storage/mergeRecords';

import type { DialogueLine, DialogueLineDoc } from './types';

/** The text fields of a dialogue line. */
export type DialogueField = 'speaker' | 'line' | 'delivery';

export async function listDialogue(shotId: string): Promise<DialogueLine[]> {
  const lines = await db.dialogueLines.where('shotId').equals(shotId).toArray();
  return lines.filter((line) => line.deletedAt === null).sort((a, b) => a.order - b.order);
}

/** Every line of a world, deleted ones included — sync needs the tombstones. */
export async function listDialogueRecords(worldId: string): Promise<DialogueLine[]> {
  return db.dialogueLines.where('worldId').equals(worldId).toArray();
}

/** Adds a line at the end of the shot. */
export async function createDialogueLine(worldId: string, shotId: string): Promise<DialogueLine> {
  const existing = await listDialogue(shotId);
  const timestamp = new Date().toISOString();
  const line: DialogueLine = {
    id: crypto.randomUUID(),
    worldId,
    shotId,
    order: (existing.at(-1)?.order ?? 0) + 1,
    speaker: '',
    line: '',
    delivery: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  await db.dialogueLines.add(line);
  return line;
}

export async function saveDialogueField(
  id: string,
  field: DialogueField,
  value: string,
): Promise<void> {
  await db.dialogueLines.update(id, { [field]: value, updatedAt: new Date().toISOString() });
}

export async function deleteDialogueLine(id: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.dialogueLines.update(id, { deletedAt: timestamp, updatedAt: timestamp });
}

/** Removes every line of a shot, as part of deleting the shot itself. */
export async function deleteDialogueOfShot(shotId: string, timestamp: string): Promise<void> {
  const lines = await db.dialogueLines.where('shotId').equals(shotId).toArray();
  for (const line of lines) {
    if (line.deletedAt === null) {
      await db.dialogueLines.update(line.id, { deletedAt: timestamp, updatedAt: timestamp });
    }
  }
}

/** Applies the lines from Drive; returns whether the local side holds more. */
export async function mergeRemoteDialogue(
  worldId: string,
  docs: DialogueLineDoc[],
): Promise<boolean> {
  const local = await listDialogueRecords(worldId);
  const { toStore, localIsAhead } = mergeByUpdatedAt(local, docs, (doc) => ({ ...doc, worldId }));
  if (toStore.length > 0) {
    await db.dialogueLines.bulkPut(toStore);
  }
  return localIsAhead;
}
