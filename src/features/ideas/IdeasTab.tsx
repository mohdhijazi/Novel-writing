import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router-dom';

import { AutosaveField } from '@/components/AutosaveField';
import { NameForm } from '@/components/NameForm';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './IdeasTab.module.css';
import { createIdea, deleteIdea, saveIdeaText, listIdeas } from './ideasRepository';

export function IdeasTab() {
  const { worldId } = useParams();
  const ideas = useLiveQuery(
    async () => (worldId === undefined ? [] : await listIdeas(worldId)),
    [worldId],
  );

  function handleCreate(text: string) {
    if (worldId === undefined) {
      return;
    }
    void createIdea(worldId, text).then(() => {
      requestSync();
    });
  }

  return (
    <section className={styles.panel} aria-label="Ideas">
      <NameForm
        label="Idea"
        placeholder="What if the bridge was never rebuilt?"
        submitLabel="Add idea"
        onSubmit={handleCreate}
      />

      {ideas && ideas.length > 0 ? (
        <ul className={styles.list}>
          {ideas.map((idea) => (
            <li key={idea.id} className={styles.item}>
              <div className={styles.text}>
                <AutosaveField
                  label="Idea"
                  labelHidden
                  value={idea.text}
                  onSave={(value) => {
                    void saveIdeaText(idea.id, value).then(() => {
                      requestSync(EDIT_SYNC_DELAY_MS);
                    });
                  }}
                />
              </div>
              <button
                type="button"
                className={styles.delete}
                aria-label={`Delete idea: ${idea.text}`}
                onClick={() => {
                  void deleteIdea(idea.id).then(() => {
                    requestSync(EDIT_SYNC_DELAY_MS);
                  });
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.note}>No ideas yet.</p>
      )}
    </section>
  );
}
