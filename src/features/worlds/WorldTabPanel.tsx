import { Navigate, useParams } from 'react-router-dom';

import styles from './WorldTabPanel.module.css';
import { DEFAULT_WORLD_TAB, findWorldTab } from './worldTabs';

/** Placeholder contents until each section gets its own feature. */
export function WorldTabPanel() {
  const { tabSlug } = useParams();
  const tab = findWorldTab(tabSlug);

  if (!tab) {
    return <Navigate to={DEFAULT_WORLD_TAB} replace />;
  }

  return (
    <section className={styles.panel} aria-label={tab.label}>
      <p className={styles.note}>No {tab.label.toLowerCase()} yet.</p>
    </section>
  );
}
