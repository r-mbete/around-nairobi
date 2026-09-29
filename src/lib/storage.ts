import Storage from "expo-sqlite/kv-store";

/** Small synchronous key-value store for settings like filters; survives restarts (O8). */
export const storage = {
  get(key: string): string | null {
    try {
      return Storage.getItemSync(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      Storage.setItemSync(key, value);
    } catch {
      // Losing a preference is better than crashing the screen.
    }
  },
};
