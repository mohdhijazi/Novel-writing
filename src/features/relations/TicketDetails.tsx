import { AutosaveField } from '@/components/AutosaveField';
import { HoldToDelete } from '@/components/HoldToDelete';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './TicketDetails.module.css';
import { deleteTicketLink, saveTicketLinkLabel } from './ticketLinksRepository';
import { ticketKindLabel, ticketLabel, type TicketSources } from './ticketLabels';
import { deleteTicket, saveTicketText } from './ticketsRepository';
import type { Ticket, TicketLink } from './types';

interface TicketDetailsProps {
  ticket: Ticket;
  links: TicketLink[];
  ticketsById: Map<string, Ticket>;
  sources: TicketSources;
  onClose: () => void;
}

export function TicketDetails({
  ticket,
  links,
  ticketsById,
  sources,
  onClose,
}: TicketDetailsProps) {
  const label = ticketLabel(ticket, sources);

  return (
    <aside className={styles.details} aria-label={`Details for ${label}`}>
      <div className={styles.header}>
        <h3 className={styles.heading}>{label}</h3>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close details">
          ×
        </button>
      </div>

      {ticket.kind === 'note' ? (
        <AutosaveField
          label="Ticket"
          multiline
          autoFocus={ticket.text === ''}
          value={ticket.text}
          onSave={(value) => {
            void saveTicketText(ticket.id, value).then(() => {
              requestSync(EDIT_SYNC_DELAY_MS);
            });
          }}
        />
      ) : (
        <p className={styles.note}>
          {ticketKindLabel(ticket, sources)} — edit it in its own tab and this ticket follows.
        </p>
      )}

      <section className={styles.links}>
        <h4 className={styles.subheading}>Links</h4>
        {links.length === 0 ? (
          <p className={styles.note}>
            None yet. Drag a + on the ticket onto another one to link them.
          </p>
        ) : (
          <ul className={styles.list}>
            {links.map((link) => {
              const otherId = link.fromId === ticket.id ? link.toId : link.fromId;
              const other = ticketsById.get(otherId);
              const otherName = other ? ticketLabel(other, sources) : 'Missing ticket';
              return (
                <li key={link.id} className={styles.item}>
                  <div className={styles.linkLabel}>
                    <AutosaveField
                      label={`Label for the link to ${otherName}`}
                      labelHidden
                      value={link.label}
                      onSave={(value) => {
                        void saveTicketLinkLabel(link.id, value).then(() => {
                          requestSync(EDIT_SYNC_DELAY_MS);
                        });
                      }}
                    />
                    <span className={styles.otherName}>{otherName}</span>
                  </div>
                  <HoldToDelete
                    className={styles.remove}
                    label={`Remove the link to ${otherName}`}
                    onDelete={() => {
                      void deleteTicketLink(link.id).then(() => {
                        requestSync(EDIT_SYNC_DELAY_MS);
                      });
                    }}
                  >
                    ×
                  </HoldToDelete>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <HoldToDelete
        className={styles.delete}
        label="Delete ticket"
        onDelete={() => {
          void deleteTicket(ticket.id).then(() => {
            onClose();
            requestSync(EDIT_SYNC_DELAY_MS);
          });
        }}
      >
        Delete ticket
      </HoldToDelete>
    </aside>
  );
}
