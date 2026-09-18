import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { requestSync } from '@/features/sync/syncScheduler';

import { ConnectionLines } from './ConnectionLines';
import { LocationDetails } from './LocationDetails';
import { LocationSquare } from './LocationSquare';
import styles from './LocationsTab.module.css';
import { createConnection, listConnections } from './connectionsRepository';
import { createLocation, listLocations } from './locationsRepository';
import { MAP_HEIGHT, MAP_WIDTH, anchorFor, positionForNewLocation, type Point } from './mapLayout';
import type { Location, LocationSide } from './types';

export function LocationsTab() {
  const { worldId } = useParams();
  const mapRef = useRef<HTMLDivElement>(null);
  /** Set while dragging from a + handle; the preview line mirrors it on screen. */
  const connectingRef = useRef<{ fromId: string; fromSide: LocationSide } | null>(null);
  const stopConnectingRef = useRef<(() => void) | null>(null);
  const [preview, setPreview] = useState<{ from: Point; to: Point } | null>(null);
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

  // A drag that outlives this screen would leave listeners behind.
  useEffect(() => () => stopConnectingRef.current?.(), []);

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

  function finishConnection(clientX: number, clientY: number) {
    const started = connectingRef.current;
    connectingRef.current = null;
    setPreview(null);
    const target = document
      .elementFromPoint(clientX, clientY)
      ?.closest<HTMLElement>('[data-location-id]');
    const toId = target?.dataset.locationId;
    const from = started ? locationsById.get(started.fromId) : undefined;
    const to = toId === undefined ? undefined : locationsById.get(toId);
    if (!started || !from || !to || worldId === undefined || from.id === to.id) {
      return;
    }
    void createConnection(worldId, { id: from.id, side: started.fromSide }, to.id).then(() => {
      requestSync();
    });
  }

  function startConnection(location: Location, side: LocationSide) {
    connectingRef.current = { fromId: location.id, fromSide: side };
    const anchor = anchorFor(location, side);
    setPreview({ from: anchor, to: anchor });

    function handleMove(event: PointerEvent) {
      const bounds = mapRef.current?.getBoundingClientRect();
      if (!bounds) {
        return;
      }
      const to = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      setPreview((current) => (current ? { from: current.from, to } : current));
    }

    function handleUp(event: PointerEvent) {
      stop();
      finishConnection(event.clientX, event.clientY);
    }

    function stop() {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      stopConnectingRef.current = null;
    }

    stopConnectingRef.current = stop;
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
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
                  startConnection(location, side);
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
