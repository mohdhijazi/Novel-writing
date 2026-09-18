import { useId, useState } from 'react';

import { AutosaveField } from '@/components/AutosaveField';
import type { CalendarMonth } from '@/features/calendar/types';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './EventCard.module.css';
import { deleteEvent, updateEvent } from './eventsRepository';
import { formatEventDate } from './timeline';
import type { WorldEvent } from './types';

interface EventCardProps {
  event: WorldEvent;
  months: CalendarMonth[];
}

export function EventCard({ event, months }: EventCardProps) {
  const monthSelectId = useId();
  const [isOpen, setIsOpen] = useState(false);

  function save(patch: Parameters<typeof updateEvent>[1]) {
    void updateEvent(event.id, patch).then(() => {
      requestSync(EDIT_SYNC_DELAY_MS);
    });
  }

  const month = months.find((candidate) => candidate.id === event.monthId);

  return (
    <li className={styles.card}>
      <button
        type="button"
        className={styles.summary}
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <span className={styles.date}>{formatEventDate(event, months)}</span>
        <span className={styles.name}>{event.name || 'Untitled event'}</span>
        <span className={styles.chevron} aria-hidden="true">
          {isOpen ? '▾' : '▸'}
        </span>
      </button>

      {isOpen && (
        <div className={styles.details}>
          <AutosaveField
            label="Name"
            value={event.name}
            onSave={(value) => {
              save({ name: value });
            }}
          />

          <div className={styles.dateFields}>
            <AutosaveField
              label="Year (negative for before year zero)"
              value={String(event.year)}
              onSave={(value) => {
                const year = Number.parseInt(value, 10);
                if (Number.isInteger(year)) {
                  save({ year });
                }
              }}
            />

            <div className={styles.field}>
              <label className={styles.label} htmlFor={monthSelectId}>
                Month
              </label>
              <select
                id={monthSelectId}
                className={styles.select}
                value={event.monthId}
                onChange={(changeEvent) => {
                  save({ monthId: changeEvent.target.value });
                }}
              >
                <option value="">No month</option>
                {months.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name === '' ? 'Unnamed month' : candidate.name}
                  </option>
                ))}
              </select>
            </div>

            <AutosaveField
              label={month ? `Day (1–${String(month.days)})` : 'Day'}
              numeric
              value={event.day === 0 ? '' : String(event.day)}
              onSave={(value) => {
                if (value.trim() === '') {
                  save({ day: 0 });
                  return;
                }
                const day = Number.parseInt(value, 10);
                const lastDay = month?.days ?? Number.MAX_SAFE_INTEGER;
                if (Number.isInteger(day) && day > 0 && day <= lastDay) {
                  save({ day });
                }
              }}
            />
          </div>

          <AutosaveField
            label="Details"
            multiline
            value={event.details}
            onSave={(value) => {
              save({ details: value });
            }}
          />

          <button
            type="button"
            className={styles.delete}
            onClick={() => {
              void deleteEvent(event.id).then(() => {
                requestSync(EDIT_SYNC_DELAY_MS);
              });
            }}
          >
            Delete event
          </button>
        </div>
      )}
    </li>
  );
}
