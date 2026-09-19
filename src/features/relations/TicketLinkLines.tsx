import { anchorFor, sideFacing, type Point } from '@/lib/map/geometry';

import styles from './TicketLinkLines.module.css';
import { BOARD_HEIGHT, BOARD_WIDTH, TICKET_SIZE } from './boardLayout';
import type { Ticket, TicketLink } from './types';

interface TicketLinkLinesProps {
  links: TicketLink[];
  ticketsById: Map<string, Ticket>;
  /** The line being dragged from a + handle, if any. */
  preview: { from: Point; to: Point } | null;
}

export function TicketLinkLines({ links, ticketsById, preview }: TicketLinkLinesProps) {
  return (
    <svg
      className={styles.overlay}
      width={BOARD_WIDTH}
      height={BOARD_HEIGHT}
      viewBox={`0 0 ${String(BOARD_WIDTH)} ${String(BOARD_HEIGHT)}`}
      aria-hidden="true"
    >
      {links.map((link) => {
        const from = ticketsById.get(link.fromId);
        const to = ticketsById.get(link.toId);
        if (!from || !to) {
          return null;
        }
        const start = anchorFor(from, link.fromSide, TICKET_SIZE);
        const end = anchorFor(to, sideFacing(start, to, TICKET_SIZE), TICKET_SIZE);
        const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
        return (
          <g key={link.id}>
            <line className={styles.line} x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
            {link.label !== '' && (
              <text className={styles.label} x={middle.x} y={middle.y} textAnchor="middle">
                {link.label}
              </text>
            )}
          </g>
        );
      })}

      {preview && (
        <line
          className={styles.preview}
          x1={preview.from.x}
          y1={preview.from.y}
          x2={preview.to.x}
          y2={preview.to.y}
        />
      )}
    </svg>
  );
}
