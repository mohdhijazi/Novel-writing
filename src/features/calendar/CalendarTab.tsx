import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router-dom';

import { AutosaveField } from '@/components/AutosaveField';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './CalendarTab.module.css';
import {
  addMonth,
  addWeekday,
  getCalendar,
  moveMonth,
  moveWeekday,
  removeMonth,
  removeWeekday,
  renameWeekday,
  setCalendarName,
  updateMonth,
} from './calendarRepository';
import { daysInYear } from './types';

const DEFAULT_MONTH_DAYS = 30;

export function CalendarTab() {
  const { worldId } = useParams();
  const calendar = useLiveQuery(
    async () => (worldId === undefined ? null : await getCalendar(worldId)),
    [worldId],
  );

  if (worldId === undefined) {
    return null;
  }

  const months = calendar?.months ?? [];
  const weekdays = calendar?.weekdays ?? [];

  /** Every edit writes the whole calendar record, then asks for a sync. */
  function save(change: Promise<void>) {
    void change.then(() => {
      requestSync(EDIT_SYNC_DELAY_MS);
    });
  }

  return (
    <section className={styles.panel} aria-label="Calendar">
      <AutosaveField
        label="Calendar name"
        value={calendar?.name ?? ''}
        onSave={(value) => {
          save(setCalendarName(worldId, value));
        }}
      />

      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <h3 className={styles.groupTitle}>Months</h3>
          <button
            type="button"
            className={styles.add}
            onClick={() => {
              save(addMonth(worldId, '', DEFAULT_MONTH_DAYS));
            }}
          >
            + Add month
          </button>
        </div>

        {months.length === 0 ? (
          <p className={styles.note}>No months yet.</p>
        ) : (
          <ol className={styles.list}>
            {months.map((month, index) => (
              <li key={month.id} className={styles.row}>
                <span className={styles.position}>{index + 1}</span>
                <div className={styles.name}>
                  <AutosaveField
                    label={`Name of month ${String(index + 1)}`}
                    labelHidden
                    value={month.name}
                    onSave={(value) => {
                      save(updateMonth(worldId, month.id, { name: value }));
                    }}
                  />
                </div>
                <div className={styles.days}>
                  <AutosaveField
                    label={`Days in month ${String(index + 1)}`}
                    labelHidden
                    numeric
                    value={String(month.days)}
                    onSave={(value) => {
                      const days = Number.parseInt(value, 10);
                      if (Number.isInteger(days) && days > 0) {
                        save(updateMonth(worldId, month.id, { days }));
                      }
                    }}
                  />
                </div>
                <span className={styles.unit}>days</span>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Move month ${String(index + 1)} earlier`}
                  disabled={index === 0}
                  onClick={() => {
                    save(moveMonth(worldId, month.id, -1));
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Move month ${String(index + 1)} later`}
                  disabled={index === months.length - 1}
                  onClick={() => {
                    save(moveMonth(worldId, month.id, 1));
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Remove month ${String(index + 1)}`}
                  onClick={() => {
                    save(removeMonth(worldId, month.id));
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
        )}

        {months.length > 0 && (
          <p className={styles.note}>
            {months.length} months, {daysInYear(calendar ?? null)} days in a year.
          </p>
        )}
      </section>

      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <h3 className={styles.groupTitle}>Days of the week</h3>
          <button
            type="button"
            className={styles.add}
            onClick={() => {
              save(addWeekday(worldId, ''));
            }}
          >
            + Add day
          </button>
        </div>

        {weekdays.length === 0 ? (
          <p className={styles.note}>No days yet.</p>
        ) : (
          <ol className={styles.list}>
            {weekdays.map((weekday, index) => (
              <li key={weekday.id} className={styles.row}>
                <span className={styles.position}>{index + 1}</span>
                <div className={styles.name}>
                  <AutosaveField
                    label={`Name of day ${String(index + 1)}`}
                    labelHidden
                    value={weekday.name}
                    onSave={(value) => {
                      save(renameWeekday(worldId, weekday.id, value));
                    }}
                  />
                </div>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Move day ${String(index + 1)} earlier`}
                  disabled={index === 0}
                  onClick={() => {
                    save(moveWeekday(worldId, weekday.id, -1));
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Move day ${String(index + 1)} later`}
                  disabled={index === weekdays.length - 1}
                  onClick={() => {
                    save(moveWeekday(worldId, weekday.id, 1));
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Remove day ${String(index + 1)}`}
                  onClick={() => {
                    save(removeWeekday(worldId, weekday.id));
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
        )}

        {weekdays.length > 0 && <p className={styles.note}>A week is {weekdays.length} days.</p>}
      </section>
    </section>
  );
}
