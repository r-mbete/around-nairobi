// expo-sqlite on web is alpha and needs wasm bundling, so the web preview uses localStorage instead.

/** Small synchronous key-value store for settings like filters; survives restarts (O8). */
export const storage = {
  get(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Private windows can block storage; filters just won't persist.
    }
  },
};
