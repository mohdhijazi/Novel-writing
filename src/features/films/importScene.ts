import { addImportedDialogue } from './dialogueRepository';
import { addImportedScene } from './scenesRepository';
import { addImportedShots } from './shotsRepository';
import type { ImportedScene } from './sceneImportSchema';

export interface SceneImportOutcome {
  sceneId: string;
  shots: number;
  lines: number;
}

/** Writes a pasted scene into an episode: the scene, its shots, then their lines. */
export async function importScene(
  worldId: string,
  episodeId: string,
  imported: ImportedScene,
): Promise<SceneImportOutcome> {
  const scene = await addImportedScene(worldId, episodeId, imported.fields);
  const shots = await addImportedShots(worldId, scene.id, imported.shots);

  let lines = 0;
  for (const [index, shot] of shots.entries()) {
    const dialogue = imported.shots[index]?.dialogue ?? [];
    await addImportedDialogue(worldId, shot.id, dialogue);
    lines += dialogue.length;
  }

  return { sceneId: scene.id, shots: shots.length, lines };
}
