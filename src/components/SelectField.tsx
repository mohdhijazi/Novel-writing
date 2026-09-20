import { useId } from 'react';

import styles from './SelectField.module.css';

interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  /** Keeps the label for screen readers but hides it, for compact rows. */
  labelHidden?: boolean;
}

/** A labelled menu that saves as soon as a value is picked. */
export function SelectField({
  label,
  value,
  options,
  onChange,
  labelHidden = false,
}: SelectFieldProps) {
  const selectId = useId();

  return (
    <div className={styles.field}>
      <label className={labelHidden ? styles.hiddenLabel : styles.label} htmlFor={selectId}>
        {label}
      </label>
      <select
        id={selectId}
        className={styles.select}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        {/* A value written elsewhere, or none yet, still has to show. */}
        {!options.includes(value) && <option value={value}>{value || '—'}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
