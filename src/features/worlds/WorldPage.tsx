import { useLiveQuery } from 'dexie-react-hooks';
import { Fragment } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';

import { useDrive } from '@/features/drive/driveContext';
import { SyncStatus } from '@/features/sync/SyncStatus';
import { useSync } from '@/features/sync/useSync';

import styles from './WorldPage.module.css';
import { WORLD_TABS } from './worldTabs';
import { getWorld } from './worldsRepository';

export function WorldPage() {
  const { worldId } = useParams();
  const { isConnected } = useDrive();
  // Keeps the automatic syncs running while a world is open; SyncStatus renders the state.
  useSync(isConnected);
  const world = useLiveQuery(
    async () => (worldId === undefined ? null : await getWorld(worldId)),
    [worldId],
  );

  if (world === undefined) {
    return null;
  }

  if (world === null) {
    return (
      <main className={styles.page}>
        <p className={styles.note}>That world no longer exists.</p>
        <Link to="/" className={styles.back}>
          Back to worlds
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.back}>
          ← Worlds
        </Link>
        <h1 className={styles.heading}>{world.name}</h1>
      </header>

      {/* NavLink marks the active tab with aria-current, which the stylesheet picks up. */}
      <nav className={styles.tabs} aria-label="World sections">
        {WORLD_TABS.map((tab) => (
          <Fragment key={tab.slug}>
            {'separated' in tab && <span className={styles.spacer} aria-hidden="true" />}
            <NavLink to={tab.slug} className={styles.tab}>
              {tab.label}
            </NavLink>
          </Fragment>
        ))}
      </nav>

      <SyncStatus />

      <Outlet />
    </main>
  );
}
