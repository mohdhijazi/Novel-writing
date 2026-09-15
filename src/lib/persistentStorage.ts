/**
 * Asks the browser to keep this app's local data (IndexedDB) instead of
 * evicting it when storage runs low. Browsers may decline; resolves to
 * whether storage is persistent.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!('storage' in navigator) || !('persist' in navigator.storage)) {
    return false;
  }
  if (await navigator.storage.persisted()) {
    return true;
  }
  return navigator.storage.persist();
}
