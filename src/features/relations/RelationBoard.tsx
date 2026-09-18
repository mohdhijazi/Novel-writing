import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { listCharacters } from '@/features/characters/charactersRepository';
import { listLocations } from '@/features/locations/locationsRepository';
import { requestSync } from '@/features/sync/syncScheduler';
import { useConnectionDrag } from '@/lib/map/useConnectionDrag';

import styles from './RelationBoard.module.css';
import { TicketCard } from './TicketCard';
import { TicketDetails } from './TicketDetails';
import { TicketLinkLines } from './TicketLinkLines';
import { BOARD_HEIGHT, BOARD_WIDTH, TICKET_SIZE, positionForNewTicket } from './boardLayout';
import { getRelation } from './relationsRepository';
import { createTicketLink, listTicketLinks } from './ticketLinksRepository';
import { characterFullName } from '@/features/characters/types';
import { createTicket, listTickets } from './ticketsRepository';
import type { TicketKind } from './types';

export function RelationBoard() {
  const { worldId, relationId } = useParams();
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const relation = useLiveQuery(
    async () => (relationId === undefined ? null : await getRelation(relationId)),
    [relationId],
  );
  const tickets = useLiveQuery(
    async () => (relationId === undefined ? [] : await listTickets(relationId)),
    [relationId],
  );
  const links = useLiveQuery(
    async () => (relationId === undefined ? [] : await listTicketLinks(relationId)),
    [relationId],
  );
  const characters = useLiveQuery(
    async () => (worldId === undefined ? [] : await listCharacters(worldId)),
    [worldId],
  );
  const locations = useLiveQuery(
    async () => (worldId === undefined ? [] : await listLocations(worldId)),
    [worldId],
  );

  const sources = {
    charactersById: new Map((characters ?? []).map((character) => [character.id, character])),
    locationsById: new Map((locations ?? []).map((location) => [location.id, location])),
  };
  const ticketsById = new Map((tickets ?? []).map((ticket) => [ticket.id, ticket]));
  const selected = tickets?.find((ticket) => ticket.id === selectedId) ?? null;

  const { preview, startConnection } = useConnectionDrag({
    mapRef,
    size: TICKET_SIZE,
    onConnect: (from, toId) => {
      if (worldId === undefined || relationId === undefined) {
        return;
      }
      void createTicketLink(worldId, relationId, from, toId).then(() => {
        requestSync();
      });
    },
  });

  function addTicket(kind: TicketKind, refId: string) {
    if (worldId === undefined || relationId === undefined) {
      return;
    }
    const { x, y } = positionForNewTicket(tickets?.length ?? 0);
    void createTicket(worldId, relationId, kind, refId, x, y).then((ticket) => {
      setSelectedId(ticket.id);
      requestSync();
    });
  }

  if (relation === undefined) {
    return null;
  }

  if (relation === null) {
    return <p className={styles.note}>That relation no longer exists.</p>;
  }

  return (
    <section className={styles.panel} aria-label={relation.name}>
      <div className={styles.header}>
        <Link to=".." relative="path" className={styles.back}>
          ← All relations
        </Link>
        <h2 className={styles.heading}>{relation.name}</h2>
      </div>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.add}
          onClick={() => {
            addTicket('note', '');
          }}
        >
          + Empty ticket
        </button>

        <select
          className={styles.picker}
          value=""
          aria-label="Add a character ticket"
          onChange={(event) => {
            addTicket('character', event.target.value);
          }}
        >
          <option value="" disabled>
            + Character…
          </option>
          {(characters ?? []).map((character) => (
            <option key={character.id} value={character.id}>
              {characterFullName(character) || 'Unnamed character'}
            </option>
          ))}
        </select>

        <select
          className={styles.picker}
          value=""
          aria-label="Add a location ticket"
          onChange={(event) => {
            addTicket('location', event.target.value);
          }}
        >
          <option value="" disabled>
            + Location…
          </option>
          {(locations ?? []).map((location) => (
            <option key={location.id} value={location.id}>
              {location.name || 'Untitled location'}
            </option>
          ))}
        </select>

        <p className={styles.hint}>Drag a ticket to move it. Drag a + onto another to link them.</p>
      </div>

      <div className={styles.content}>
        <div className={styles.viewport}>
          <div
            ref={mapRef}
            className={styles.board}
            style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}
            aria-label="Relation board"
          >
            <TicketLinkLines links={links ?? []} ticketsById={ticketsById} preview={preview} />

            {tickets?.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                sources={sources}
                mapRef={mapRef}
                isSelected={ticket.id === selectedId}
                onSelect={() => {
                  setSelectedId(ticket.id);
                }}
                onStartLink={(side) => {
                  startConnection(ticket.id, side, ticket);
                }}
              />
            ))}
          </div>
        </div>

        {selected && (
          <div className={styles.side}>
            <TicketDetails
              key={selected.id}
              ticket={selected}
              links={(links ?? []).filter(
                (link) => link.fromId === selected.id || link.toId === selected.id,
              )}
              ticketsById={ticketsById}
              sources={sources}
              onClose={() => {
                setSelectedId(null);
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
