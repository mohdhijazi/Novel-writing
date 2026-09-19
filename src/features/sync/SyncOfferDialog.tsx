import { useSyncExternalStore } from 'react';

import styles from './SyncOfferDialog.module.css';
import { dismissSyncOffer, getSyncState, subscribeToSync, syncNow } from './syncScheduler';

/**
 * Shown when a connection is made and work is waiting that Drive has never
 * seen — reconnecting should not quietly overwrite anything without asking.
 */
export function SyncOfferDialog() {
  const { isOfferingSync, offeredChanges } = useSyncExternalStore(subscribeToSync, getSyncState);

  if (!isOfferingSync) {
    return null;
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="sync-offer">
      <div className={styles.dialog}>
        <h2 id="sync-offer" className={styles.heading}>
          Save your work to Google Drive?
        </h2>
        <p className={styles.note}>
          {offeredChanges} change{offeredChanges === 1 ? '' : 's'} made on this device{' '}
          {offeredChanges === 1 ? 'is' : 'are'} not in Drive yet. Sync now to upload{' '}
          {offeredChanges === 1 ? 'it' : 'them'} and pick up anything from your other device.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={dismissSyncOffer}>
            Not now
          </button>
          <button type="button" className={styles.primary} onClick={syncNow} autoFocus>
            Sync now
          </button>
        </div>
      </div>
    </div>
  );
}
