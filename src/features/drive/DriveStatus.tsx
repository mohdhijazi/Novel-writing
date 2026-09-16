import { useDrive } from './driveContext';
import styles from './DriveStatus.module.css';

export function DriveStatus() {
  const { isConnected, isConnecting, error, connect, disconnect } = useDrive();

  return (
    <div className={styles.status}>
      {isConnected ? (
        <>
          <span className={styles.label}>Google Drive connected</span>
          <button type="button" className={styles.button} onClick={disconnect}>
            Disconnect
          </button>
        </>
      ) : (
        <>
          <span className={styles.label}>Not connected — worlds stay on this device</span>
          <button type="button" className={styles.button} onClick={connect} disabled={isConnecting}>
            {isConnecting ? 'Connecting…' : 'Connect Google Drive'}
          </button>
        </>
      )}
      {error !== null && <p className={styles.error}>{error}</p>}
    </div>
  );
}
