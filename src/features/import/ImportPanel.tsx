import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { requestSync } from '@/features/sync/syncScheduler';

import styles from './ImportPanel.module.css';
import { buildImportPrompt } from './importPrompt';
import { parseImportFile, type ImportedWorld } from './importSchema';
import { importWorld, type ImportOutcome } from './importWorld';

interface Pending {
  fileName: string;
  world: ImportedWorld;
  warnings: string[];
}

export function ImportPanel() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);

  function handleCopyPrompt() {
    navigator.clipboard
      .writeText(buildImportPrompt())
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

  function handleFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Let the same file be picked again after a failed attempt.
    event.target.value = '';
    if (!file) {
      return;
    }
    setErrors([]);
    setOutcome(null);
    void file.text().then((text) => {
      const result = parseImportFile(text);
      if (!result.world) {
        setPending(null);
        setErrors(result.errors);
        return;
      }
      setPending({ fileName: file.name, world: result.world, warnings: result.warnings });
    });
  }

  function handleImport() {
    if (!pending) {
      return;
    }
    const { world, warnings } = pending;
    setPending(null);
    void importWorld(world).then((result) => {
      setOutcome({ ...result, warnings: [...warnings, ...result.warnings] });
      requestSync();
    });
  }

  return (
    <section className={styles.panel} aria-label="Import a world">
      <h2 className={styles.heading}>Import a world</h2>
      <p className={styles.note}>
        Give your AI the story — a PDF, notes, anything it can read — along with the prompt below.
        It answers with a file; choose that file here and its characters, locations, events,
        calendar and ideas become a new world.
      </p>

      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={handleCopyPrompt}>
          {copied ? 'Prompt copied' : 'Copy the prompt'}
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          Choose a file…
        </button>
        <input
          ref={fileInputRef}
          className={styles.fileInput}
          type="file"
          accept="application/json,.json,.txt"
          onChange={handleFileChosen}
        />
      </div>

      {errors.length > 0 && (
        <ul className={styles.errors}>
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      {pending && (
        <div className={styles.summary}>
          <p className={styles.note}>
            <strong>{pending.fileName}</strong> holds the world{' '}
            <strong>{pending.world.worldName}</strong>: {pending.world.characters.length}{' '}
            characters, {pending.world.locations.length} locations, {pending.world.events.length}{' '}
            events, {pending.world.ideas.length} ideas
            {pending.world.calendar
              ? `, a calendar of ${String(pending.world.calendar.months.length)} months`
              : ', no calendar'}
            .
          </p>
          {pending.warnings.length > 0 && (
            <ul className={styles.warnings}>
              {pending.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          <button type="button" className={styles.primary} onClick={handleImport}>
            Import as a new world
          </button>
        </div>
      )}

      {outcome && (
        <div className={styles.summary}>
          <p className={styles.note}>
            Imported {outcome.counts.characters} characters, {outcome.counts.locations} locations,{' '}
            {outcome.counts.connections} connections, {outcome.counts.events} events and{' '}
            {outcome.counts.ideas} ideas.
          </p>
          {outcome.warnings.length > 0 && (
            <ul className={styles.warnings}>
              {outcome.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className={styles.primary}
            onClick={() => {
              void navigate(`/worlds/${outcome.worldId}`);
            }}
          >
            Open the world
          </button>
        </div>
      )}
    </section>
  );
}
