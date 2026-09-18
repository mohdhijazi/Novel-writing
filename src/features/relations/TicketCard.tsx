import { type RefObject } from 'react';

import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';
import { MAP_SIDES, type MapSide } from '@/lib/map/geometry';
import { useNodeDrag } from '@/lib/map/useNodeDrag';

import styles from './TicketCard.module.css';
import { BOARD_BOUNDS, TICKET_SIZE } from './boardLayout';
import { ticketKindLabel, ticketLabel, type TicketSources } from './ticketLabels';
import { moveTicket } from './ticketsRepository';
import type { Ticket } from './types';

interface TicketCardProps {
  ticket: Ticket;
  sources: TicketSources;
  mapRef: RefObject<HTMLDivElement | null>;
  isSelected: boolean;
  onSelect: () => void;
  onStartLink: (side: MapSide) => void;
}

export function TicketCard({
  ticket,
  sources,
  mapRef,
  isSelected,
  onSelect,
  onStartLink,
}: TicketCardProps) {
  const label = ticketLabel(ticket, sources);
  const { nodeRef, dragHandlers } = useNodeDrag({
    mapRef,
    position: ticket,
    size: TICKET_SIZE,
    bounds: BOARD_BOUNDS,
    onMoved: (x, y) => {
      void moveTicket(ticket.id, x, y).then(() => {
        requestSync(EDIT_SYNC_DELAY_MS);
      });
    },
    onTap: onSelect,
  });

  return (
    <div
      ref={nodeRef}
      className={styles.ticket}
      data-node-id={ticket.id}
      data-kind={ticket.kind}
      data-selected={isSelected}
      style={{ left: ticket.x, top: ticket.y, width: TICKET_SIZE, height: TICKET_SIZE }}
      {...dragHandlers}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.kind}>{ticketKindLabel(ticket, sources)}</span>

      {MAP_SIDES.map((side) => (
        <button
          key={side}
          type="button"
          className={styles.handle}
          data-side={side}
          aria-label={`Link from the ${side} of ${label}`}
          onPointerDown={(event) => {
            // Keep the ticket from starting a drag of its own.
            event.stopPropagation();
            onStartLink(side);
          }}
        >
          +
        </button>
      ))}
    </div>
  );
}
