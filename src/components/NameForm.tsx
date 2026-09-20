import { useId, useState, type SyntheticEvent } from 'react';

import styles from './NameForm.module.css';

interface NameFormProps {
  label: string;
  submitLabel: string;
  onSubmit: (value: string) => void;
}

/** One-line "name it and add it" form, shared by worlds, novels and chapters. */
export function NameForm({ label, submitLabel, onSubmit }: NameFormProps) {
  const inputId = useId();
  const [value, setValue] = useState('');

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    onSubmit(trimmed);
    setValue('');
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={styles.row}>
        <input
          id={inputId}
          className={styles.input}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          autoComplete="off"
        />
        <button type="submit" className={styles.button} disabled={value.trim() === ''}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
