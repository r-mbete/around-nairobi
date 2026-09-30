// Tests run in Node, so on-device storage becomes an in-memory map. Clear it with `__resetStorage()`.
jest.mock("@/lib/storage", () => {
  const data = new Map<string, string>();
  return {
    storage: {
      get: (key: string) => data.get(key) ?? null,
      set: (key: string, value: string) => void data.set(key, value),
    },
    __resetStorage: () => data.clear(),
  };
});
