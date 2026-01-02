type CacheEntry<T> = {
  value: T;
  createdAt: number;
};

export const stableStringify = (value: unknown) =>
  JSON.stringify(value, (_key, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.keys(val as Record<string, unknown>)
        .sort()
        .reduce((acc, key) => {
          acc[key] = (val as Record<string, unknown>)[key];
          return acc;
        }, {} as Record<string, unknown>);
    }
    return val;
  });

export const createExpiringCache = <T>(ttlMs: number) => {
  const store = new Map<string, CacheEntry<T>>();

  const get = (key: string) => {
    const entry = store.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.createdAt > ttlMs) {
      store.delete(key);
      return null;
    }

    return entry.value;
  };

  const set = (key: string, value: T) => {
    store.set(key, { value, createdAt: Date.now() });
  };

  return { get, set };
};
