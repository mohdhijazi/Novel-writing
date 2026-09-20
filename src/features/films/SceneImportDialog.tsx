import { useId, useState } from 'react';

import { requestSync } from '@/features/sync/syncScheduler';

import styles from './SceneImportDialog.module.css';
import { importScene, type SceneImportOutcome } from './importScene';
import { buildSceneImportPrompt } from './sceneImportPrompt';
import { parseSceneJson } from './sceneImportSchema';

interface SceneImportDialogProps {
  worldId: string;
  episodeId: string;
  onClose: () => void;
  /** Called with the new scene's id once it has been written. */
  onAdded: (sceneId: string) => void;
}

/**
 * Pasting a scene an AI wrote: the prompt to ask it with, and the box to paste
 * the answer into. Pictures are not part of it — they are chosen in the app.
 */
export function SceneImportDialog({
  worldId,
  episodeId,
  onClose,
  onAdded,
}: SceneImportDialogProps) {
  const textareaId = useId();
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [outcome, setOutcome] = useState<SceneImportOutcome | null>(null);

  function copyPrompt() {
    navigator.clipboard
      .writeText(buildSceneImportPrompt())
      .then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch(() => {
        setErrors(['Could not reach the clipboard. Copy the prompt by hand instead.']);
      });
  }

  function add() {
    const result = parseSceneJson(text);
    setErrors(result.errors);
    setWarnings(result.warnings);
    if (result.scene === null) {
      return;
    }
    setIsAdding(true);
    void importScene(worldId, episodeId, result.scene)
      .then((added) => {
        requestSync();
        // The scene is written; what was skipped or repaired is worth seeing
        // before leaving, so the dialog reports rather than closing itself.
        setIsAdding(false);
        setOutcome(added);
      })
      .catch(() => {
        setIsAdding(false);
        setErrors(['The scene could not be added. Try again.']);
      });
  }

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scene-import-title"
    >
      <div className={styles.dialog}>
        <h2 id="scene-import-title" className={styles.heading}>
          Add a scene from JSON
        </h2>
        <p className={styles.note}>
          Give your AI the chapter along with the prompt below. It answers with JSON; paste that
          answer here and it becomes a scene, with its shots and the lines said over them.
        </p>

        {outcome === null && (
          <>
            <button type="button" className={styles.secondary} onClick={copyPrompt}>
              {copied ? 'Prompt copied' : 'Copy the prompt'}
            </button>

            <label className={styles.label} htmlFor={textareaId}>
              The JSON
            </label>
            <textarea
              id={textareaId}
              className={styles.textarea}
              value={text}
              spellCheck={false}
              autoFocus
              onChange={(event) => {
                setText(event.target.value);
              }}
            />
          </>
        )}

        {outcome !== null && (
          <p className={styles.note}>
            Added the scene with {outcome.shots} shot{outcome.shots === 1 ? '' : 's'} and{' '}
            {outcome.lines} line{outcome.lines === 1 ? '' : 's'} of dialogue.
          </p>
        )}

        {errors.length > 0 && (
          <ul className={styles.errors}>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}

        {warnings.length > 0 && (
          <ul className={styles.warnings}>
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            {outcome === null ? 'Cancel' : 'Close'}
          </button>
          {outcome === null ? (
            <button
              type="button"
              className={styles.primary}
              disabled={text.trim() === '' || isAdding}
              onClick={add}
            >
              {isAdding ? 'Adding…' : 'Add scene'}
            </button>
          ) : (
            <button
              type="button"
              className={styles.primary}
              onClick={() => {
                onAdded(outcome.sceneId);
              }}
            >
              Open the scene
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
