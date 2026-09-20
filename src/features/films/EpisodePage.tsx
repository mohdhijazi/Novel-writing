import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { HoldToDelete } from '@/components/HoldToDelete';
import { NameForm } from '@/components/NameForm';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './EpisodePage.module.css';
import { SceneImportDialog } from './SceneImportDialog';
import { getEpisode } from './episodesRepository';
import { createScene, deleteScene, listScenes } from './scenesRepository';

export function EpisodePage() {
  const { worldId, episodeId } = useParams();
  const navigate = useNavigate();
  const [isPasting, setIsPasting] = useState(false);
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

      <div className={styles.add}>
        <NameForm label="Scene title" submitLabel="Add scene" onSubmit={handleCreate} />
        <button
          type="button"
          className={styles.fromJson}
          onClick={() => {
            setIsPasting(true);
          }}
        >
          Add from JSON
        </button>
      </div>

      {isPasting && worldId !== undefined && episodeId !== undefined && (
        <SceneImportDialog
          worldId={worldId}
          episodeId={episodeId}
          onClose={() => {
            setIsPasting(false);
          }}
          onAdded={(sceneId) => {
            setIsPasting(false);
            void navigate(`scenes/${sceneId}`);
          }}
        />
      )}

      {scenes && scenes.length > 0 ? (
        <ol className={styles.list}>
          {scenes.map((scene) => (
            <li key={scene.id} className={styles.row}>
              <Link to={`scenes/${scene.id}`} className={styles.item}>
                <span className={styles.number}>{scene.number}</span>
                <span className={styles.title}>{scene.title}</span>
                {scene.sceneCode !== '' && <span className={styles.code}>{scene.sceneCode}</span>}
              </Link>
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
