import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router-dom';

import { requestSync } from '@/features/sync/syncScheduler';

import { CharacterCard } from './CharacterCard';
import { CharacterForm } from './CharacterForm';
import styles from './CharactersTab.module.css';
import { createCharacter, listCharacters } from './charactersRepository';

export function CharactersTab() {
  const { worldId } = useParams();
  const characters = useLiveQuery(
    async () => (worldId === undefined ? [] : await listCharacters(worldId)),
    [worldId],
  );

  function handleCreate(firstName: string, lastName: string) {
    if (worldId === undefined) {
      return;
    }
    void createCharacter(worldId, firstName, lastName).then(() => {
      requestSync();
    });
  }

  return (
    <section className={styles.panel} aria-label="Characters">
      <CharacterForm onSubmit={handleCreate} />

      {characters && characters.length > 0 ? (
        <ul className={styles.list}>
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </ul>
      ) : (
        <p className={styles.note}>No characters yet.</p>
      )}
    </section>
  );
}
