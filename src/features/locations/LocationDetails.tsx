import { useCallback } from 'react';

import { AutosaveField } from '@/components/AutosaveField';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './LocationDetails.module.css';
import { deleteLocation, saveLocationField } from './locationsRepository';
import type { Location, LocationTextField } from './types';

interface LocationDetailsProps {
  location: Location;
  onClose: () => void;
}

export function LocationDetails({ location, onClose }: LocationDetailsProps) {
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
      </div>

      <button
        type="button"
        className={styles.delete}
        onClick={() => {
          void deleteLocation(location.id).then(() => {
            onClose();
            requestSync(EDIT_SYNC_DELAY_MS);
          });
        }}
      >
        Delete location
      </button>
    </aside>
  );
}
