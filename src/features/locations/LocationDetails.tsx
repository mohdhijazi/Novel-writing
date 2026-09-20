import { useCallback } from 'react';

import { AutosaveField } from '@/components/AutosaveField';
import { HoldToDelete } from '@/components/HoldToDelete';
import { ImageField } from '@/features/images/ImageField';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './LocationDetails.module.css';
import { deleteConnection } from './connectionsRepository';
import { deleteLocation, saveLocationField } from './locationsRepository';
import type { Connection, Location, LocationTextField } from './types';

interface LocationDetailsProps {
  location: Location;
  connections: Connection[];
  locationsById: Map<string, Location>;
  onClose: () => void;
}

export function LocationDetails({
  location,
  connections,
  locationsById,
  onClose,
}: LocationDetailsProps) {
  const save = useCallback(
    (field: LocationTextField, value: string) => {
      void saveLocationField(location.id, field, value).then(() => {
        requestSync(EDIT_SYNC_DELAY_MS);
      });
    },
    [location.id],
  );

  return (
    <aside className={styles.details} aria-label={`Details for ${location.name || 'location'}`}>
      <div className={styles.header}>
        <h3 className={styles.heading}>{location.name || 'Untitled location'}</h3>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close details">
          ×
        </button>
      </div>

      <div className={styles.fields}>
        <AutosaveField
          label="Name"
          value={location.name}
          autoFocus={location.name === ''}
          onSave={(value) => {
            save('name', value);
          }}
        />
        <AutosaveField
          label="Type"
          value={location.type}
          onSave={(value) => {
            save('type', value);
          }}
        />
        <AutosaveField
          label="Area"
          value={location.area}
          onSave={(value) => {
            save('area', value);
          }}
        />
        <ImageField worldId={location.worldId} ownerId={location.id} label="Picture" />
      </div>

      <section className={styles.connections}>
        <h4 className={styles.subheading}>Connections</h4>
        {connections.length === 0 ? (
          <p className={styles.note}>
            None yet. Drag a + on the square onto another one to connect them.
          </p>
        ) : (
          <ul className={styles.list}>
            {connections.map((connection) => {
              const otherId =
                connection.fromId === location.id ? connection.toId : connection.fromId;
              const other = locationsById.get(otherId);
              const otherName = other && other.name !== '' ? other.name : 'Untitled location';
              return (
                <li key={connection.id} className={styles.item}>
                  <span>{otherName}</span>
                  <HoldToDelete
                    className={styles.remove}
                    label={`Remove connection to ${otherName}`}
                    onDelete={() => {
                      void deleteConnection(connection.id).then(() => {
                        requestSync(EDIT_SYNC_DELAY_MS);
                      });
                    }}
                  >
                    ×
                  </HoldToDelete>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <HoldToDelete
        className={styles.delete}
        label="Delete location"
        onDelete={() => {
          void deleteLocation(location.id).then(() => {
            onClose();
            requestSync(EDIT_SYNC_DELAY_MS);
          });
        }}
      >
        Delete location
      </HoldToDelete>
    </aside>
  );
}
