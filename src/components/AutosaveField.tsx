import { useEffect, useId, useState } from 'react';

import styles from './AutosaveField.module.css';

/** Milliseconds of no typing before the value is saved. */
const SAVE_DELAY_MS = 500;

interface AutosaveFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  autoFocus?: boolean;
  /** Keeps the label for screen readers but hides it, for compact rows. */
  labelHidden?: boolean;
  /** Shows a number keyboard on touch devices. */
  numeric?: boolean;
}

/** A labelled field that saves itself shortly after typing stops. */
export function AutosaveField({
  label,
  value,
  onSave,
  multiline = false,
  autoFocus = false,
  labelHidden = false,
  numeric = false,
}: AutosaveFieldProps) {
  const inputId = useId();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (draft === value) {
      return;
    }
    const timer = setTimeout(() => {
      onSave(draft);
    }, SAVE_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [draft, value, onSave]);

  return (
    <div className={styles.field}>
      <label className={labelHidden ? styles.hiddenLabel : styles.label} htmlFor={inputId}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={inputId}
          className={styles.textarea}
          value={draft}
          rows={2}
          autoFocus={autoFocus}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
        />
      ) : (
        <input
          id={inputId}
          className={styles.input}
          value={draft}
          autoComplete="off"
          inputMode={numeric ? 'numeric' : undefined}
          autoFocus={autoFocus}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
        />
      )}
    </div>
  );
}
