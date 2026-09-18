import { useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './LocationSquare.module.css';
import { deleteLocation, moveLocation, renameLocation } from './locationsRepository';
import { SQUARE_SIZE, clampToMap } from './mapLayout';
import type { Location } from './types';

/** Movement under this many pixels counts as a tap, which opens the name for editing. */
const DRAG_THRESHOLD_PX = 4;

interface DragState {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  moved: boolean;
}

interface LocationSquareProps {
  location: Location;
  mapRef: RefObject<HTMLDivElement | null>;
  autoEdit: boolean;
  onEditDone: () => void;
}

export function LocationSquare({ location, mapRef, autoEdit, onEditDone }: LocationSquareProps) {
  const squareRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  // Tapping a square opens its name; `autoEdit` does the same for a square the
  // toolbar just created, which can arrive after this component has mounted.
  const [isTapped, setIsTapped] = useState(false);
  const [draftName, setDraftName] = useState(location.name);
  const isEditing = isTapped || autoEdit;

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const square = squareRef.current;
    if (isEditing || !square || event.button !== 0) {
      return;
    }
    const bounds = square.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      x: location.x,
      y: location.y,
      moved: false,
    };
    square.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const square = squareRef.current;
    const map = mapRef.current;
    if (!drag || !square || !map || drag.pointerId !== event.pointerId) {
      return;
    }
    const mapBounds = map.getBoundingClientRect();
    const { x, y } = clampToMap(
      event.clientX - mapBounds.left - drag.offsetX,
      event.clientY - mapBounds.top - drag.offsetY,
    );
    if (Math.abs(x - drag.x) + Math.abs(y - drag.y) > DRAG_THRESHOLD_PX) {
      drag.moved = true;
    }
    drag.x = x;
    drag.y = y;
    // Moved directly rather than through state: React re-renders from the saved
    // position once the drag ends.
    square.style.left = `${String(x)}px`;
    square.style.top = `${String(y)}px`;
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) {
      return;
    }
    dragRef.current = null;
    if (!drag.moved) {
      setIsTapped(true);
      return;
    }
    void moveLocation(location.id, drag.x, drag.y).then(() => {
      requestSync(EDIT_SYNC_DELAY_MS);
    });
  }

  function commitName() {
    setIsTapped(false);
    onEditDone();
    if (draftName === location.name) {
      return;
    }
    void renameLocation(location.id, draftName).then(() => {
      requestSync(EDIT_SYNC_DELAY_MS);
    });
  }

  return (
    <div
      ref={squareRef}
      className={styles.square}
      style={{ left: location.x, top: location.y, width: SQUARE_SIZE, height: SQUARE_SIZE }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {isEditing ? (
        <input
          className={styles.input}
          value={draftName}
          autoFocus
          aria-label="Location name"
          onChange={(event) => {
            setDraftName(event.target.value);
          }}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commitName();
            }
            if (event.key === 'Escape') {
              setDraftName(location.name);
              setIsTapped(false);
              onEditDone();
            }
          }}
        />
      ) : (
        <span className={styles.name}>{location.name || 'Untitled'}</span>
      )}

      <button
        type="button"
        className={styles.delete}
        aria-label={`Delete ${location.name || 'location'}`}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={() => {
          void deleteLocation(location.id).then(() => {
            requestSync(EDIT_SYNC_DELAY_MS);
          });
        }}
      >
        ×
      </button>
    </div>
  );
}
