import { useId, useState, type SyntheticEvent } from 'react';

import styles from './CharacterForm.module.css';

interface CharacterFormProps {
  onSubmit: (firstName: string, lastName: string) => void;
}

export function CharacterForm({ onSubmit }: CharacterFormProps) {
  const firstNameId = useId();
  const lastNameId = useId();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const canSubmit = firstName.trim() !== '' || lastName.trim() !== '';

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    onSubmit(firstName.trim(), lastName.trim());
    setFirstName('');
    setLastName('');
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={firstNameId}>
          First name
        </label>
        <input
          id={firstNameId}
          className={styles.input}
          value={firstName}
          onChange={(event) => {
            setFirstName(event.target.value);
          }}
          placeholder="Mira"
          autoComplete="off"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={lastNameId}>
          Last name
        </label>
        <input
          id={lastNameId}
          className={styles.input}
          value={lastName}
          onChange={(event) => {
            setLastName(event.target.value);
          }}
          placeholder="Vale"
          autoComplete="off"
        />
      </div>

      <button type="submit" className={styles.button} disabled={!canSubmit}>
        Add character
      </button>
    </form>
  );
}
