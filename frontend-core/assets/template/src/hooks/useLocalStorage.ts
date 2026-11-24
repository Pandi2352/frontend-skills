import { useCallback, useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
const subscribe = (run: () => void) => {
  listeners.add(run);
  window.addEventListener('storage', run);
  return () => {
    listeners.delete(run);
    window.removeEventListener('storage', run);
  };
};
const read = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

/** A small setting kept in this browser and synced between tabs. Not for secrets. */
export function useLocalStorage(key: string, initial: string) {
  const value = useSyncExternalStore(subscribe, () => read(key), () => null) ?? initial;
  const set = useCallback(
    (next: string) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Storage can be full or blocked; the setting is just not kept.
      }
      listeners.forEach((run) => run());
    },
    [key],
  );
  return [value, set] as const;
}
