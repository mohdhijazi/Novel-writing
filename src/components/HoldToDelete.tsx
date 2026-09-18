import { useEffect, useRef, useState, type ReactNode } from 'react';

import styles from './HoldToDelete.module.css';

/** How long the button must be held before it deletes. */
const HOLD_MS = 4000;
/** How often the countdown redraws while holding. */
const TICK_MS = 100;

interface HoldToDeleteProps {
  onDelete: () => void;
  /** Describes the action for screen readers, e.g. "Delete character". */
  label: string;
  /** Normal button content, shown when not being held. */
  children: ReactNode;
  className?: string;
}

/**
 * A delete button that only fires after a steady hold, showing the seconds
 * left as it counts down. Deleting is the one action here with no undo, so it
 * asks for deliberate intent rather than a stray tap.
 */
export function HoldToDelete({ onDelete, label, children, className }: HoldToDeleteProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopTimer() {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function cancelHold() {
    stopTimer();
    setRemaining(null);
  }

  function startHold() {
    if (timerRef.current !== null) {
      return;
    }
    const endsAt = Date.now() + HOLD_MS;
    setRemaining(Math.ceil(HOLD_MS / 1000));
    timerRef.current = setInterval(() => {
      const msLeft = endsAt - Date.now();
      if (msLeft <= 0) {
        cancelHold();
        onDelete();
        return;
      }
      setRemaining(Math.ceil(msLeft / 1000));
    }, TICK_MS);
  }

  // A hold interrupted by the component going away must not keep ticking.
  useEffect(() => stopTimer, []);

  const isHolding = remaining !== null;
  const progress = isHolding
    ? ((Math.ceil(HOLD_MS / 1000) - remaining) / (HOLD_MS / 1000)) * 100
    : 0;

  return (
    <button
      type="button"
      className={[styles.button, className].filter(Boolean).join(' ')}
      aria-label={`${label} — hold to confirm`}
      title={`${label} — hold to confirm`}
      data-holding={isHolding}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onBlur={cancelHold}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
          event.preventDefault();
          startHold();
        }
      }}
      onKeyUp={cancelHold}
    >
      <span
        className={styles.progress}
        style={{ width: `${String(progress)}%` }}
        aria-hidden="true"
      />
      <span className={styles.content}>{isHolding ? remaining : children}</span>
    </button>
  );
}
