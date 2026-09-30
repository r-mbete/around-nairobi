import { useSyncExternalStore } from "react";

import { storage } from "./storage";

export type Store<T> = {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  use: () => T;
};

/**
 * Tiny observable store. With a `key`, state is saved to on-device storage on every change and
 * read back synchronously at startup, so screens render from it without waiting (O1, O8).
 */
export function createStore<T>(initial: T, options: { key?: string; revive?: (saved: unknown) => T } = {}): Store<T> {
  const { key, revive } = options;
  let current = initial;

  if (key) {
    const raw = storage.get(key);
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        current = revive ? revive(parsed) : (parsed as T);
      } catch {
        current = initial; // Corrupt data shouldn't brick the app; start fresh.
      }
    }
  }

  const listeners = new Set<() => void>();

  const store: Store<T> = {
    get: () => current,
    set(next) {
      current = typeof next === "function" ? (next as (prev: T) => T)(current) : next;
      if (key) storage.set(key, JSON.stringify(current));
      listeners.forEach((l) => l());
    },
    use: () =>
      useSyncExternalStore(
        (l) => {
          listeners.add(l);
          return () => listeners.delete(l);
        },
        () => current,
        () => current,
      ),
  };
  return store;
}
