import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { requestSync } from '@/features/sync/syncScheduler';

import { LocationSquare } from './LocationSquare';
import styles from './LocationsTab.module.css';
import { createLocation, listLocations } from './locationsRepository';
import { MAP_HEIGHT, MAP_WIDTH, positionForNewLocation } from './mapLayout';

export function LocationsTab() {
  const { worldId } = useParams();
  const mapRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const locations = useLiveQuery(
    async () => (worldId === undefined ? [] : await listLocations(worldId)),
    [worldId],
  );

  function handleAdd() {
    if (worldId === undefined) {
      return;
    }
    const { x, y } = positionForNewLocation(locations?.length ?? 0);
    void createLocation(worldId, '', x, y).then((location) => {
      setEditingId(location.id);
      requestSync();
    });
  }

  return (
    <section className={styles.panel} aria-label="Locations">
      <div className={styles.toolbar}>
        <button type="button" className={styles.add} onClick={handleAdd} aria-label="Add location">
          +
        </button>
        <p className={styles.hint}>Drag a square to move it. Tap it to rename.</p>
      </div>

      <div className={styles.viewport}>
        <div
          ref={mapRef}
          className={styles.map}
          style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
          aria-label="Map area"
        >
          {locations?.map((location) => (
            <LocationSquare
              key={location.id}
              location={location}
              mapRef={mapRef}
              autoEdit={location.id === editingId}
              onEditDone={() => {
                setEditingId(null);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
