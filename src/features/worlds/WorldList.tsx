import { Link } from 'react-router-dom';

import styles from './WorldList.module.css';
import type { World } from './types';

export function WorldList({ worlds }: { worlds: World[] }) {
  return (
    <ul className={styles.list}>
      {worlds.map((world) => (
        <li key={world.id}>
          <Link to={`/worlds/${world.id}`} className={styles.item}>
            <span className={styles.name}>{world.name}</span>
            <span className={styles.sync}>
              {world.driveFolderId === null ? 'Not synced yet' : 'In Google Drive'}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
