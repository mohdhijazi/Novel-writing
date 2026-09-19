import { characterFullName } from '@/features/characters/types';
import type { Character } from '@/features/characters/types';
import type { Location } from '@/features/locations/types';

import type { Ticket } from './types';

export interface TicketSources {
  charactersById: Map<string, Character>;
  locationsById: Map<string, Location>;
}

/**
 * What a ticket reads as on the board. Character and location tickets show the
 * record's current name, so renaming a character updates every board it is on.
 */
export function ticketLabel(ticket: Ticket, sources: TicketSources): string {
  switch (ticket.kind) {
    case 'character': {
      const character = sources.charactersById.get(ticket.refId);
      const name = character ? characterFullName(character) : '';
      return name === '' ? 'Unnamed character' : name;
    }
    case 'location': {
      const location = sources.locationsById.get(ticket.refId);
      const name = location?.name ?? '';
      return name === '' ? 'Unnamed location' : name;
    }
    case 'note':
      return ticket.text === '' ? 'Empty ticket' : ticket.text;
  }
}

/** The small caption under a ticket's label. */
export function ticketKindLabel(ticket: Ticket, sources: TicketSources): string {
  switch (ticket.kind) {
    case 'character':
      return sources.charactersById.has(ticket.refId) ? 'Character' : 'Character (deleted)';
    case 'location':
      return sources.locationsById.has(ticket.refId) ? 'Location' : 'Location (deleted)';
    case 'note':
      return 'Note';
  }
}
