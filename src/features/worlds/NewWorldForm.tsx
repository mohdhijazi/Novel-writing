import { useState, type SyntheticEvent } from 'react';

import styles from './NewWorldForm.module.css';

export function NewWorldForm({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState('');

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    onCreate(trimmed);
    setName('');
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="world-name">
        World name
      </label>
      <div className={styles.row}>
        <input
          id="world-name"
          className={styles.input}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          placeholder="The Glass Road"
          autoComplete="off"
        />
        <button type="submit" className={styles.button} disabled={name.trim() === ''}>
          Create world
        </button>
      </div>
    </form>
  );
}
