import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';

import { HoldToDelete } from '@/components/HoldToDelete';
import { NameForm } from '@/components/NameForm';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './FilmsTab.module.css';
import { createFilm, deleteFilm, listFilms } from './filmsRepository';

export function FilmsTab() {
  const { worldId } = useParams();
  const films = useLiveQuery(
    async () => (worldId === undefined ? [] : await listFilms(worldId)),
    [worldId],
  );

  function handleCreate(title: string) {
    if (worldId === undefined) {
      return;
    }
    void createFilm(worldId, title).then(() => {
      requestSync();
    });
  }

  return (
    <section className={styles.panel} aria-label="Films">
      <NameForm label="Film title" submitLabel="Add film" onSubmit={handleCreate} />

      {films && films.length > 0 ? (
        <ul className={styles.list}>
          {films.map((film) => (
            <li key={film.id} className={styles.row}>
              <Link to={film.id} className={styles.item}>
                {film.title}
              </Link>
              <HoldToDelete
                className={styles.delete}
                label={`Delete film ${film.title}`}
                onDelete={() => {
                  void deleteFilm(film.id).then(() => {
                    requestSync(EDIT_SYNC_DELAY_MS);
                  });
                }}
              >
                ×
              </HoldToDelete>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.note}>No films yet. A film holds episodes, and each episode scenes.</p>
      )}
    </section>
  );
}
