import {
  createJsonFile,
  downloadJsonFile,
  findJsonFile,
  updateJsonFile,
} from '@/lib/google/driveApi';
import {
  SCHEMA_VERSION,
  fileNameFor,
  type CollectionFile,
  type CollectionName,
  type StoredRecord,
} from '@/lib/storage/collectionFile';

export interface CollectionSync<TRecord extends StoredRecord, TDoc extends StoredRecord> {
  collection: CollectionName;
  /** Every record of the world, tombstones included. */
  listRecords: (worldId: string) => Promise<TRecord[]>;
  /** Applies Drive's records; returns whether the local side holds more. */
  mergeRemote: (worldId: string, docs: TDoc[]) => Promise<boolean>;
  toDoc: (record: TRecord) => TDoc;
}

/**
 * Merges one collection file in a world's Drive folder. These files are small,
 * so they are read on every pass rather than tracked for changes, and written
 * back only when this device holds something newer.
 */
export async function syncCollectionForWorld<
  TRecord extends StoredRecord,
  TDoc extends StoredRecord,
>(sync: CollectionSync<TRecord, TDoc>, worldId: string, worldFolderId: string): Promise<void> {
  const fileName = fileNameFor(sync.collection);

  function toFile(records: TRecord[]): CollectionFile<TDoc> {
    return {
      schemaVersion: SCHEMA_VERSION,
      collection: sync.collection,
      updatedAt: new Date().toISOString(),
      records: records.map((record) => sync.toDoc(record)),
    };
  }

  const file = await findJsonFile(fileName, worldFolderId);
  const local = await sync.listRecords(worldId);

  if (!file) {
    if (local.length > 0) {
      await createJsonFile(fileName, worldFolderId, toFile(local));
    }
    return;
  }

  const content = await downloadJsonFile<CollectionFile<TDoc>>(file.id);
  const localIsAhead = await sync.mergeRemote(worldId, content.records);
  if (!localIsAhead) {
    return;
  }

  await updateJsonFile(file.id, toFile(await sync.listRecords(worldId)));
}
