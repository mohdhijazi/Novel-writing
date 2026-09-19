import { Link } from 'react-router-dom';

import { HoldToDelete } from '@/components/HoldToDelete';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './WorldList.module.css';
import { deleteWorld } from './worldsRepository';
import type { World } from './types';

export function WorldList({ worlds }: { worlds: World[] }) {
  return (
    <ul className={styles.list}>
      {worlds.map((world) => (
        <li key={world.id} className={styles.row}>
          <Link to={`/worlds/${world.id}`} className={styles.item}>
            <span className={styles.name}>{world.name}</span>
            <span className={styles.sync}>
              {world.driveFolderId === null ? 'Not synced yet' : 'In Google Drive'}
            </span>
          </Link>
          <HoldToDelete
            className={styles.delete}
            label={`Delete the world ${world.name} and everything in it`}
            holdSeconds={4}
            onDelete={() => {
              void deleteWorld(world.id).then(() => {
                requestSync(EDIT_SYNC_DELAY_MS);
              });
            }}
          >
            ×
          </HoldToDelete>
        </li>
      ))}
    </ul>
  );
}
