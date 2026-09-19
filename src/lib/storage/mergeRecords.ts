import type { StoredRecord } from './collectionFile';

export interface MergeResult<TLocal> {
  /** Records from Drive that win and should be written locally. */
  toStore: TLocal[];
  /**
   * True when this device holds something Drive does not — a newer version of a
   * record, or one Drive has never seen — so the merged file must be uploaded.
   */
  localIsAhead: boolean;
}

/**
 * Last-write-wins merge of one collection: per id, the newer `updatedAt` wins.
 * Pure — callers do the reading and writing.
 */
export function mergeByUpdatedAt<TLocal extends StoredRecord, TDoc extends StoredRecord>(
  local: TLocal[],
  docs: TDoc[],
  toLocal: (doc: TDoc) => TLocal,
): MergeResult<TLocal> {
  const localById = new Map(local.map((record) => [record.id, record]));
  const toStore: TLocal[] = [];
  let localIsAhead = false;

  for (const doc of docs) {
    const existing = localById.get(doc.id);
    if (existing && existing.updatedAt >= doc.updatedAt) {
      if (existing.updatedAt > doc.updatedAt) {
        localIsAhead = true;
      }
      continue;
    }
    toStore.push(toLocal(doc));
  }

  const remoteIds = new Set(docs.map((doc) => doc.id));
  if (local.some((record) => !remoteIds.has(record.id))) {
    localIsAhead = true;
  }

  return { toStore, localIsAhead };
}
