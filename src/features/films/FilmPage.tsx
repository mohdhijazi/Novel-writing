import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';

import { HoldToDelete } from '@/components/HoldToDelete';
import { NameForm } from '@/components/NameForm';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './FilmPage.module.css';
import { createEpisode, deleteEpisode, listEpisodes } from './episodesRepository';
import { getFilm } from './filmsRepository';

export function FilmPage() {
  const { worldId, filmId } = useParams();
  const film = useLiveQuery(
    async () => (filmId === undefined ? null : await getFilm(filmId)),
    [filmId],
  );
  const episodes = useLiveQuery(
    async () => (filmId === undefined ? [] : await listEpisodes(filmId)),
    [filmId],
  );

  if (film === undefined) {
    return null;
  }

  if (film === null) {
    return <p className={styles.note}>That film no longer exists.</p>;
  }

  function handleCreate(title: string) {
    if (worldId === undefined || filmId === undefined) {
      return;
    }
    void createEpisode(worldId, filmId, title).then(() => {
      requestSync();
    });
  }

  return (
    <section className={styles.panel} aria-label={film.title}>
      <div className={styles.header}>
        <Link to=".." relative="path" className={styles.back}>
          ← All films
        </Link>
        <h2 className={styles.heading}>{film.title}</h2>
      </div>

      <NameForm label="Episode title" submitLabel="Add episode" onSubmit={handleCreate} />

      {episodes && episodes.length > 0 ? (
        <ol className={styles.list}>
          {episodes.map((episode) => (
            <li key={episode.id} className={styles.row}>
              <Link to={`episodes/${episode.id}`} className={styles.item}>
                <span className={styles.number}>{episode.number}</span>
                <span>{episode.title}</span>
              </Link>
              <HoldToDelete
                className={styles.delete}
                label={`Delete episode ${episode.title}`}
                onDelete={() => {
                  void deleteEpisode(episode.id).then(() => {
                    requestSync(EDIT_SYNC_DELAY_MS);
                  });
                }}
              >
                ×
              </HoldToDelete>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.note}>No episodes yet.</p>
      )}
    </section>
  );
}
