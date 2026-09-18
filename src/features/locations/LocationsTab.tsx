import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { requestSync } from '@/features/sync/syncScheduler';

import { LocationDetails } from './LocationDetails';
import { LocationSquare } from './LocationSquare';
import styles from './LocationsTab.module.css';
import { createLocation, listLocations } from './locationsRepository';
import { MAP_HEIGHT, MAP_WIDTH, positionForNewLocation } from './mapLayout';

export function LocationsTab() {
  const { worldId } = useParams();
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const locations = useLiveQuery(
    async () => (worldId === undefined ? [] : await listLocations(worldId)),
    [worldId],
  );

  const selected = locations?.find((location) => location.id === selectedId) ?? null;

  function handleAdd() {
    if (worldId === undefined) {
      return;
    }
    const { x, y } = positionForNewLocation(locations?.length ?? 0);
    void createLocation(worldId, x, y).then((location) => {
      setSelectedId(location.id);
      requestSync();
    });
  }

  return (
    <section className={styles.panel} aria-label="Locations">
      <div className={styles.toolbar}>
        <button type="button" className={styles.add} onClick={handleAdd} aria-label="Add location">
          +
        </button>
        <p className={styles.hint}>Drag a square to move it. Click it to edit the details.</p>
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
              isSelected={location.id === selectedId}
              onSelect={() => {
                setSelectedId(location.id);
              }}
            />
          ))}
        </div>
      </div>

      {selected && (
        <LocationDetails
          key={selected.id}
          location={selected}
          onClose={() => {
            setSelectedId(null);
          }}
        />
      )}
    </section>
  );
}
