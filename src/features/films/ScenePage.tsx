import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AutosaveField } from '@/components/AutosaveField';
import { SelectField } from '@/components/SelectField';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import { BeatCard } from './BeatCard';
import { DialogueCard } from './DialogueCard';
import styles from './ScenePage.module.css';
import { createBeat, listBeats } from './beatsRepository';
import { createDialogueLine, listDialogue } from './dialogueRepository';
import { getEpisode } from './episodesRepository';
import { exportScenePdf } from './exportScenePdf';
import { getFilm } from './filmsRepository';
import { SCENE_CLOSING_GROUPS, SCENE_SETUP_GROUPS, type SceneFieldGroup } from './sceneFields';
import { getScene, saveSceneField } from './scenesRepository';
import { sceneSlugline, type Scene, type SceneTextField } from './types';

export function ScenePage() {
  const { worldId, filmId, episodeId, sceneId } = useParams();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);

  const scene = useLiveQuery(
    async () => (sceneId === undefined ? null : await getScene(sceneId)),
    [sceneId],
  );
  const beats = useLiveQuery(
    async () => (sceneId === undefined ? [] : await listBeats(sceneId)),
    [sceneId],
  );
  const dialogue = useLiveQuery(
    async () => (sceneId === undefined ? [] : await listDialogue(sceneId)),
    [sceneId],
  );
  // Only to say, on the exported sheet, where the scene sits.
  const episode = useLiveQuery(
    async () => (episodeId === undefined ? null : await getEpisode(episodeId)),
    [episodeId],
  );
  const film = useLiveQuery(
    async () => (filmId === undefined ? null : await getFilm(filmId)),
    [filmId],
  );

  if (scene === undefined) {
    return null;
  }

  if (scene === null) {
    return <p className={styles.note}>That scene no longer exists.</p>;
  }

  function save(field: SceneTextField, value: string) {
    if (sceneId === undefined) {
      return;
    }
    void saveSceneField(sceneId, field, value).then(() => {
      requestSync(EDIT_SYNC_DELAY_MS);
    });
  }

  function handleExport(current: Scene) {
    setIsExporting(true);
    setExportFailed(false);
    const episodeName =
      episode === null || episode === undefined
        ? ''
        : [`Episode ${String(episode.number)}`, episode.title]
            .filter((part) => part !== '')
            .join(' — ');
    exportScenePdf({
      scene: current,
      beats: beats ?? [],
      dialogue: dialogue ?? [],
      context: [film?.title ?? '', episodeName].filter((part) => part !== '').join('  ·  '),
    })
      .then(() => {
        setIsExporting(false);
      })
      .catch(() => {
        setIsExporting(false);
        setExportFailed(true);
      });
  }

  function addBeat() {
    if (worldId === undefined || sceneId === undefined) {
      return;
    }
    void createBeat(worldId, sceneId).then(() => {
      requestSync();
    });
  }

  function addLine() {
    if (worldId === undefined || sceneId === undefined) {
      return;
    }
    void createDialogueLine(worldId, sceneId).then(() => {
      requestSync();
    });
  }

  function renderGroup(group: SceneFieldGroup, current: Scene) {
    return (
      <section key={group.title} className={styles.group}>
        <h3 className={styles.groupTitle}>{group.title}</h3>
        {group.note !== undefined && <p className={styles.groupNote}>{group.note}</p>}
        <div className={styles.fields}>
          {group.fields.map((definition) =>
            definition.options === undefined ? (
              <AutosaveField
                key={definition.key}
                label={definition.label}
                value={current[definition.key]}
                multiline={definition.multiline}
                onSave={(value) => {
                  save(definition.key, value);
                }}
              />
            ) : (
              <SelectField
                key={definition.key}
                label={definition.label}
                value={current[definition.key]}
                options={definition.options}
                onChange={(value) => {
                  save(definition.key, value);
                }}
              />
            ),
          )}
        </div>
      </section>
    );
  }

  const slugline = sceneSlugline(scene);

  return (
    <section className={styles.panel} aria-label={scene.title || `Scene ${String(scene.number)}`}>
      <div className={styles.header}>
        <Link to="../.." relative="path" className={styles.back}>
          ← Scenes
        </Link>
        <div className={styles.titleRow}>
          <h2 className={styles.heading}>
            <span className={styles.sceneNumber}>
              Scene {scene.number}
              {scene.sceneCode !== '' && ` · ${scene.sceneCode}`}
            </span>
            {scene.title || 'Untitled scene'}
          </h2>
          <button
            type="button"
            className={styles.export}
            disabled={isExporting}
            onClick={() => {
              handleExport(scene);
            }}
          >
            {isExporting ? 'Making the PDF…' : 'Export as PDF'}
          </button>
        </div>
        {slugline !== '' && <p className={styles.slugline}>{slugline}</p>}
        {exportFailed && <p className={styles.error}>The PDF could not be made. Try again.</p>}
      </div>

      {SCENE_SETUP_GROUPS.map((group) => renderGroup(group, scene))}

      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Shot breakdown</h3>
        <p className={styles.groupNote}>
          A clip runs five seconds, so a scene is a handful of short beats rather than one long
          description.
        </p>
        {beats && beats.length > 0 && (
          <ol className={styles.cards}>
            {beats.map((beat) => (
              <BeatCard key={beat.id} beat={beat} />
            ))}
          </ol>
        )}
        <button type="button" className={styles.add} onClick={addBeat}>
          + Add beat
        </button>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Dialogue</h3>
        <p className={styles.groupNote}>
          These lines are what the dub and the subtitles are made from.
        </p>
        {dialogue && dialogue.length > 0 && (
          <ol className={styles.cards}>
            {dialogue.map((line) => (
              <DialogueCard key={line.id} line={line} />
            ))}
          </ol>
        )}
        <button type="button" className={styles.add} onClick={addLine}>
          + Add line
        </button>
      </section>

      {SCENE_CLOSING_GROUPS.map((group) => renderGroup(group, scene))}
    </section>
  );
}
