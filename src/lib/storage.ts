// localStorage that never throws. Storage can be missing (server rendering),
// disabled (privacy settings) or full; the app must keep working in all cases,
// just without remembering anything.

const listeners = new Set<() => void>();
let available: boolean | undefined;

/**
 * Whether localStorage can be written. Checked once and cached: the probe
 * writes a key, which would otherwise fire "storage" events in other tabs.
 */
export function isStorageAvailable(): boolean {
  if (available === undefined) {
    try {
      const probe = "malamot.probe";
      window.localStorage.setItem(probe, probe);
      window.localStorage.removeItem(probe);
      available = true;
    } catch {
      available = false;
    }
  }
  return available;
}

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Returns false if the value could not be stored. */
export function writeStorage(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return false;
  }
  for (const listener of listeners) listener();
  return true;
}

/** Subscribes to writes from this tab and from other tabs (the "storage" event). */
export function subscribeStorage(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
