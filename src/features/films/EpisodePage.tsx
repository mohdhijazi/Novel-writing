import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';

import { HoldToDelete } from '@/components/HoldToDelete';
import { NameForm } from '@/components/NameForm';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './EpisodePage.module.css';
import { getEpisode } from './episodesRepository';
import { createScene, deleteScene, listScenes } from './scenesRepository';

export function EpisodePage() {
  const { worldId, episodeId } = useParams();
  const episode = useLiveQuery(
    async () => (episodeId === undefined ? null : await getEpisode(episodeId)),
    [episodeId],
  );
  const scenes = useLiveQuery(
    async () => (episodeId === undefined ? [] : await listScenes(episodeId)),
    [episodeId],
  );

  if (episode === undefined) {
    return null;
  }

  if (episode === null) {
    return <p className={styles.note}>That episode no longer exists.</p>;
  }

  function handleCreate(title: string) {
    if (worldId === undefined || episodeId === undefined) {
      return;
    }
    void createScene(worldId, episodeId, title).then(() => {
      requestSync();
    });
  }

  return (
    <section className={styles.panel} aria-label={episode.title}>
      <div className={styles.header}>
        <Link to="../.." relative="path" className={styles.back}>
          ← Episodes
        </Link>
        <h2 className={styles.heading}>
          <span className={styles.episodeNumber}>Episode {episode.number}</span>
          {episode.title}
        </h2>
      </div>

      <NameForm
        label="Scene title"
        placeholder="The harbour at first light"
        submitLabel="Add scene"
        onSubmit={handleCreate}
      />

      {scenes && scenes.length > 0 ? (
        <ol className={styles.list}>
          {scenes.map((scene) => (
            <li key={scene.id} className={styles.row}>
              <div className={styles.item}>
                <span className={styles.number}>{scene.number}</span>
                <span>{scene.title}</span>
              </div>
              <HoldToDelete
                className={styles.delete}
                label={`Delete scene ${scene.title}`}
                onDelete={() => {
                  void deleteScene(scene.id).then(() => {
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
        <p className={styles.note}>No scenes yet.</p>
      )}
    </section>
  );
}
