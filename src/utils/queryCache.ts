/**
 * queryCache.ts
 *
 * Simple in-memory cache for frequently accessed data.
 * Reduces database calls by caching results with TTL (Time To Live).
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  // Default TTL: 5 minutes
  private defaultTTL = 5 * 60 * 1000;

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs ?? this.defaultTTL,
    });
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a prefix
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries for a specific user
   */
  invalidateUser(userId: string): void {
    this.invalidatePrefix(`user:${userId}:`);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or fetch data with caching
   * If cache miss, fetches data and caches it
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }
}

// Singleton instance
export const queryCache = new QueryCache();

// Cache keys constants
export const CACHE_KEYS = {
  // Holiday status - 2 minute TTL (can change during session)
  activeHoliday: (userId: string) => `user:${userId}:activeHoliday`,
  holidayStats: (userId: string) => `user:${userId}:holidayStats`,

  // Notification preferences - 5 minute TTL
  notificationPrefs: (userId: string) => `user:${userId}:notificationPrefs`,

  // Group data - 1 minute TTL (frequently updated)
  groupMembers: (groupId: string) => `group:${groupId}:members`,
} as const;

// TTL constants
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,    // 1 minute
  MEDIUM: 2 * 60 * 1000,   // 2 minutes
  LONG: 5 * 60 * 1000,     // 5 minutes
  VERY_LONG: 15 * 60 * 1000, // 15 minutes
} as const;

export default queryCache;
