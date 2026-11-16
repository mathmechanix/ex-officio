/**
 * Lightweight in-memory / sessionStorage cache for instant tab navigation.
 * Enables 0ms tab switching across Handover, Team, Knowledge, Structure, Timeline, etc.
 */

const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export const clientCache = {
  get: <T = any>(key: string): T | null => {
    if (typeof window === "undefined") return null;

    // 1. Check in-memory Map (fastest)
    const mem = memoryCache.get(key);
    if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
      return mem.data as T;
    }

    // 2. Check sessionStorage
    try {
      const raw = sessionStorage.getItem(`eo_cache_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          memoryCache.set(key, parsed);
          return parsed.data as T;
        }
      }
    } catch {}

    return null;
  },

  set: <T = any>(key: string, data: T): void => {
    if (typeof window === "undefined") return;
    const entry = { data, timestamp: Date.now() };
    memoryCache.set(key, entry);
    try {
      sessionStorage.setItem(`eo_cache_${key}`, JSON.stringify(entry));
    } catch {}
  },

  invalidate: (keyPrefix: string): void => {
    if (typeof window === "undefined") return;
    for (const k of memoryCache.keys()) {
      if (k.startsWith(keyPrefix)) {
        memoryCache.delete(k);
      }
    }
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(`eo_cache_${keyPrefix}`)) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {}
  },
};
