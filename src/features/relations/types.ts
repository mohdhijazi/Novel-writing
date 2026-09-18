import type { MapSide } from '@/lib/map/geometry';
import type { StoredRecord } from '@/lib/storage/collectionFile';

/** A board showing how a handful of people and places relate to each other. */
export interface Relation extends StoredRecord {
  worldId: string;
  name: string;
  createdAt: string;
}

/** What a ticket stands for. A note is free text; the others mirror a record. */
export type TicketKind = 'note' | 'character' | 'location';

/** A card on a relation board. */
export interface Ticket extends StoredRecord {
  worldId: string;
  relationId: string;
  kind: TicketKind;
  /** The character or location this ticket points at; empty for a note. */
  refId: string;
  /** The note's own text; empty for character and location tickets. */
  text: string;
  x: number;
  y: number;
  createdAt: string;
}

/** A labelled line between two tickets, e.g. "sister of" or "burned down". */
export interface TicketLink extends StoredRecord {
  worldId: string;
  relationId: string;
  fromId: string;
  fromSide: MapSide;
  toId: string;
  label: string;
  createdAt: string;
}

export type RelationDoc = Omit<Relation, 'worldId'>;
export type TicketDoc = Omit<Ticket, 'worldId'>;
export type TicketLinkDoc = Omit<TicketLink, 'worldId'>;
