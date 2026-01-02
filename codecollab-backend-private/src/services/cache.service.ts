// src/services/cache.service.ts
import { logger } from "../utils/logger";

interface CacheItem<T> {
  value: T;
  expiry: number;
}

export const CacheService = {
  store: new Map<string, CacheItem<any>>(),

  /**
   * Set a value in cache with TTL (seconds)
   */
  set<T>(key: string, value: T, ttlSeconds: number = 60) {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiry });
  },

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  },

  /**
   * Delete a value from cache
   */
  del(key: string) {
    this.store.delete(key);
  },

  /**
   * Clear expired items (Cleanup)
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiry) {
        this.store.delete(key);
      }
    }
    logger.info("🧹 Cache cleanup completed");
  },
};

// Run cleanup every 5 minutes
setInterval(() => CacheService.cleanup(), 5 * 60 * 1000);
