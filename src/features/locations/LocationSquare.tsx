import { useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './LocationSquare.module.css';
import { moveLocation } from './locationsRepository';
import { SQUARE_SIZE, clampToMap } from './mapLayout';
import { LOCATION_SIDES, type Location, type LocationSide } from './types';

/** Movement under this many pixels counts as a tap, which opens the details. */
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
  isSelected: boolean;
  onSelect: () => void;
  onStartConnection: (side: LocationSide) => void;
}

export function LocationSquare({
  location,
  mapRef,
  isSelected,
  onSelect,
  onStartConnection,
}: LocationSquareProps) {
  const squareRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const square = squareRef.current;
    if (!square || event.button !== 0) {
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
      onSelect();
      return;
    }
    void moveLocation(location.id, drag.x, drag.y).then(() => {
      requestSync(EDIT_SYNC_DELAY_MS);
    });
  }

  return (
    <div
      ref={squareRef}
      className={styles.square}
      data-location-id={location.id}
      data-selected={isSelected}
      style={{ left: location.x, top: location.y, width: SQUARE_SIZE, height: SQUARE_SIZE }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <span className={styles.name}>{location.name || 'Untitled'}</span>
      {location.type !== '' && <span className={styles.type}>{location.type}</span>}

      {LOCATION_SIDES.map((side) => (
        <button
          key={side}
          type="button"
          className={styles.handle}
          data-side={side}
          aria-label={`Connect from the ${side} of ${location.name || 'this location'}`}
          onPointerDown={(event) => {
            // Keep the square from starting a drag of its own.
            event.stopPropagation();
            onStartConnection(side);
          }}
        >
          +
        </button>
      ))}
    </div>
  );
}
