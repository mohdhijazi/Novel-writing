import { type RefObject } from 'react';

import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';
import { MAP_SIDES, type MapSide } from '@/lib/map/geometry';
import { useNodeDrag } from '@/lib/map/useNodeDrag';

import styles from './LocationSquare.module.css';
import { moveLocation } from './locationsRepository';
import { MAP_BOUNDS, SQUARE_SIZE } from './mapLayout';
import type { Location } from './types';

interface LocationSquareProps {
  location: Location;
  mapRef: RefObject<HTMLDivElement | null>;
  isSelected: boolean;
  onSelect: () => void;
  onStartConnection: (side: MapSide) => void;
}

export function LocationSquare({
  location,
  mapRef,
  isSelected,
  onSelect,
  onStartConnection,
}: LocationSquareProps) {
  const { nodeRef, dragHandlers } = useNodeDrag({
    mapRef,
    position: location,
    size: SQUARE_SIZE,
    bounds: MAP_BOUNDS,
    onMoved: (x, y) => {
      void moveLocation(location.id, x, y).then(() => {
        requestSync(EDIT_SYNC_DELAY_MS);
      });
    },
    onTap: onSelect,
  });

  return (
    <div
      ref={nodeRef}
      className={styles.square}
      data-node-id={location.id}
      data-selected={isSelected}
      style={{ left: location.x, top: location.y, width: SQUARE_SIZE, height: SQUARE_SIZE }}
      {...dragHandlers}
    >
      <span className={styles.name}>{location.name || 'Untitled'}</span>
      {location.type !== '' && <span className={styles.type}>{location.type}</span>}

      {MAP_SIDES.map((side) => (
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
