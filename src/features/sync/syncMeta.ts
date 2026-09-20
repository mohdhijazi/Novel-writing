import { db } from '@/lib/db/database';

/** One row, holding what the device knows about its last trip to Drive. */
export const SYNC_META_ID = 'sync';

export interface SyncMeta {
  id: string;
  /** When the last successful sync started, or null if it never has. */
  lastSyncedAt: string | null;
}

export async function getSyncMeta(): Promise<SyncMeta> {
  return (await db.syncMeta.get(SYNC_META_ID)) ?? { id: SYNC_META_ID, lastSyncedAt: null };
}

export async function setLastSyncedAt(lastSyncedAt: string): Promise<void> {
  await db.syncMeta.put({ id: SYNC_META_ID, lastSyncedAt });
}

/**
 * How many records have been written since the last successful sync — what
 * would be uploaded if you synced right now. Every table indexes `updatedAt`,
 * so this counts without reading the records themselves.
 */
export async function countPendingChanges(): Promise<number> {
  const { lastSyncedAt } = await getSyncMeta();
  const tables = [
    db.worlds,
    db.novels,
    db.chapters,
    db.paragraphs,
    db.characters,
    db.locations,
    db.connections,
    db.calendars,
    db.events,
    db.ideas,
    db.relations,
    db.tickets,
    db.ticketLinks,
    db.images,
    db.films,
    db.episodes,
    db.scenes,
    db.beats,
    db.dialogueLines,
  ];
  if (lastSyncedAt === null) {
    const counts = await Promise.all(tables.map((table) => table.count()));
    return counts.reduce((total, count) => total + count, 0);
  }
  const counts = await Promise.all(
    tables.map((table) => table.where('updatedAt').above(lastSyncedAt).count()),
  );
  return counts.reduce((total, count) => total + count, 0);
}
