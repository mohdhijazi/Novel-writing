import { useLiveQuery } from 'dexie-react-hooks';
import { useState, type SyntheticEvent } from 'react';
import { useParams } from 'react-router-dom';

import { getCalendar } from '@/features/calendar/calendarRepository';
import { requestSync } from '@/features/sync/syncScheduler';

import { EventCard } from './EventCard';
import styles from './EventsTab.module.css';
import { createEvent, listEvents } from './eventsRepository';
import { sortEventsByDate } from './timeline';

export function EventsTab() {
  const { worldId } = useParams();
  const [name, setName] = useState('');
  const [year, setYear] = useState('');

  const events = useLiveQuery(
    async () => (worldId === undefined ? [] : await listEvents(worldId)),
    [worldId],
  );
  const calendar = useLiveQuery(
    async () => (worldId === undefined ? null : await getCalendar(worldId)),
    [worldId],
  );

  const months = calendar?.months ?? [];
  const timeline = sortEventsByDate(events ?? [], months);
  const parsedYear = Number.parseInt(year, 10);
  const canSubmit = name.trim() !== '' && Number.isInteger(parsedYear);

  function handleSubmit(submitEvent: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    submitEvent.preventDefault();
    if (!canSubmit || worldId === undefined) {
      return;
    }
    void createEvent(worldId, name.trim(), parsedYear).then(() => {
      requestSync();
    });
    setName('');
    setYear('');
  }

  return (
    <section className={styles.panel} aria-label="Events">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="event-name">
            Event
          </label>
          <input
            id="event-name"
            className={styles.input}
            value={name}
            placeholder="The bridge falls"
            autoComplete="off"
            onChange={(changeEvent) => {
              setName(changeEvent.target.value);
            }}
          />
        </div>

        <div className={styles.yearField}>
          <label className={styles.label} htmlFor="event-year">
            Year
          </label>
          <input
            id="event-year"
            className={styles.input}
            value={year}
            placeholder="-120"
            autoComplete="off"
            onChange={(changeEvent) => {
              setYear(changeEvent.target.value);
            }}
          />
        </div>

        <button type="submit" className={styles.button} disabled={!canSubmit}>
          Add event
        </button>
      </form>

      {months.length === 0 && (
        <p className={styles.note}>Add months in the Calendar tab to place events within a year.</p>
      )}

      {timeline.length > 0 ? (
        <ol className={styles.timeline}>
          {timeline.map((event) => (
            <EventCard key={event.id} event={event} months={months} />
          ))}
        </ol>
      ) : (
        <p className={styles.note}>No events yet.</p>
      )}
    </section>
  );
}
