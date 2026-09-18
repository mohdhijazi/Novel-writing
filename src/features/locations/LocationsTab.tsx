import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { requestSync } from '@/features/sync/syncScheduler';
import { useConnectionDrag } from '@/lib/map/useConnectionDrag';

import { ConnectionLines } from './ConnectionLines';
import { LocationDetails } from './LocationDetails';
import { LocationSquare } from './LocationSquare';
import styles from './LocationsTab.module.css';
import { createConnection, listConnections } from './connectionsRepository';
import { createLocation, listLocations } from './locationsRepository';
import { MAP_HEIGHT, MAP_WIDTH, SQUARE_SIZE, positionForNewLocation } from './mapLayout';

export function LocationsTab() {
  const { worldId } = useParams();
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const locations = useLiveQuery(
    async () => (worldId === undefined ? [] : await listLocations(worldId)),
    [worldId],
  );
  const connections = useLiveQuery(
    async () => (worldId === undefined ? [] : await listConnections(worldId)),
    [worldId],
  );

  const locationsById = new Map((locations ?? []).map((location) => [location.id, location]));
  const selected = locations?.find((location) => location.id === selectedId) ?? null;

  const { preview, startConnection } = useConnectionDrag({
    mapRef,
    size: SQUARE_SIZE,
    onConnect: (from, toId) => {
      if (worldId === undefined) {
        return;
      }
      void createConnection(worldId, from, toId).then(() => {
        requestSync();
      });
    },
  });

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
        <p className={styles.hint}>
          Drag a square to move it, click it to edit. Drag a + onto another square to connect them.
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.viewport}>
          <div
            ref={mapRef}
            className={styles.map}
            style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
            aria-label="Map area"
          >
            <ConnectionLines
              connections={connections ?? []}
              locationsById={locationsById}
              preview={preview}
            />

            {locations?.map((location) => (
              <LocationSquare
                key={location.id}
                location={location}
                mapRef={mapRef}
                isSelected={location.id === selectedId}
                onSelect={() => {
                  setSelectedId(location.id);
                }}
                onStartConnection={(side) => {
                  startConnection(location.id, side, location);
                }}
              />
            ))}
          </div>
        </div>

        {selected && (
          <div className={styles.side}>
            <LocationDetails
              key={selected.id}
              location={selected}
              connections={(connections ?? []).filter(
                (connection) =>
                  connection.fromId === selected.id || connection.toId === selected.id,
              )}
              locationsById={locationsById}
              onClose={() => {
                setSelectedId(null);
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
