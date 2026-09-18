import type { StoredRecord } from '@/lib/storage/collectionFile';

/** A one-line idea for a world — a thought caught before it escapes. */
export interface Idea extends StoredRecord {
  worldId: string;
  text: string;
  createdAt: string;
}

/** An idea as stored in `ideas.json`; the world is the folder it sits in. */
export type IdeaDoc = Omit<Idea, 'worldId'>;
