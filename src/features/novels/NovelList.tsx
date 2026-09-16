import type { Novel } from './types';
import styles from './NovelList.module.css';

export function NovelList({ novels }: { novels: Novel[] }) {
  return (
    <ul className={styles.list}>
      {novels.map((novel) => (
        <li key={novel.id} className={styles.item}>
          <span className={styles.title}>{novel.title}</span>
          <span className={styles.sync}>
            {novel.driveFolderId === null ? 'Not synced yet' : 'In Google Drive'}
          </span>
        </li>
      ))}
    </ul>
  );
}
