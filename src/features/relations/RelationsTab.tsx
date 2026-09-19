import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';

import { HoldToDelete } from '@/components/HoldToDelete';
import { NameForm } from '@/components/NameForm';
import { EDIT_SYNC_DELAY_MS, requestSync } from '@/features/sync/syncScheduler';

import styles from './RelationsTab.module.css';
import { createRelation, deleteRelation, listRelations } from './relationsRepository';

export function RelationsTab() {
  const { worldId } = useParams();
  const relations = useLiveQuery(
    async () => (worldId === undefined ? [] : await listRelations(worldId)),
    [worldId],
  );

  function handleCreate(name: string) {
    if (worldId === undefined) {
      return;
    }
    void createRelation(worldId, name).then(() => {
      requestSync();
    });
  }

  return (
    <section className={styles.panel} aria-label="Relations">
      <NameForm
        label="Relation"
        placeholder="The harbour families"
        submitLabel="Add relation"
        onSubmit={handleCreate}
      />

      {relations && relations.length > 0 ? (
        <ul className={styles.list}>
          {relations.map((relation) => (
            <li key={relation.id} className={styles.row}>
              <Link to={relation.id} className={styles.item}>
                {relation.name}
              </Link>
              <HoldToDelete
                className={styles.delete}
                label={`Delete relation ${relation.name}`}
                onDelete={() => {
                  void deleteRelation(relation.id).then(() => {
                    requestSync(EDIT_SYNC_DELAY_MS);
                  });
                }}
              >
                ×
              </HoldToDelete>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.note}>
          No relations yet. A relation is a board where you lay out people and places and draw the
          links between them.
        </p>
      )}
    </section>
  );
}
