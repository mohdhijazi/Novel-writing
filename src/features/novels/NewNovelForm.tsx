import { useState, type SyntheticEvent } from 'react';

import styles from './NewNovelForm.module.css';

export function NewNovelForm({ onCreate }: { onCreate: (title: string) => void }) {
  const [title, setTitle] = useState('');

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    onCreate(trimmed);
    setTitle('');
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="novel-title">
        Novel title
      </label>
      <div className={styles.row}>
        <input
          id="novel-title"
          className={styles.input}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
          }}
          placeholder="The Glass Road"
          autoComplete="off"
        />
        <button type="submit" className={styles.button} disabled={title.trim() === ''}>
          Create novel
        </button>
      </div>
    </form>
  );
}
