/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 59: HIGH-PERFORMANCE CACHING LAYER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Redis-compatible caching with fallback to in-memory
 * - Supports Vercel KV, Upstash Redis, or in-memory
 * - TTL-based expiration
 * - Cache warming
 * - Metrics tracking
 */

import { logger } from '../observability';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for bulk invalidation
  staleWhileRevalidate?: number; // Serve stale while refreshing
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  staleAt?: number;
  tags: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// IN-MEMORY CACHE (FALLBACK)
// ═══════════════════════════════════════════════════════════════════════════════

class InMemoryCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 3600; // Default 1 hour
    const tags = options.tags || [];

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl * 1000,
      staleAt: options.staleWhileRevalidate
        ? Date.now() + (ttl - options.staleWhileRevalidate) * 1000
        : undefined,
      tags,
    };

    this.store.set(key, entry);

    // Update tag index
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (entry) {
      // Remove from tag index
      for (const tag of (entry as CacheEntry<unknown>).tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }
    return this.store.delete(key);
  }

  async deleteByTag(tag: string): Promise<number> {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let deleted = 0;
    for (const key of keys) {
      if (await this.delete(key)) deleted++;
    }
    this.tagIndex.delete(tag);
    return deleted;
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.tagIndex.clear();
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.store.keys());
    if (!pattern) return allKeys;

    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  size(): number {
    return this.store.size;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REDIS CACHE (VERCEL KV / UPSTASH)
// ═══════════════════════════════════════════════════════════════════════════════

class RedisCache {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
    this.token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  }

  private async execute(command: string[]): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      throw new Error(`Redis error: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.execute(['GET', key]);
      if (!result) return null;
      return JSON.parse(result as string);
    } catch {
      logger.error('Redis GET failed', { key });
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || 3600;
      const serialized = JSON.stringify(value);

      await this.execute(['SET', key, serialized, 'EX', ttl.toString()]);

      // Store tags in a separate set
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await this.execute(['SADD', `tag:${tag}`, key]);
          await this.execute(['EXPIRE', `tag:${tag}`, (ttl * 2).toString()]);
        }
      }
    } catch (error) {
      logger.error('Redis SET failed', error, { key });
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.execute(['DEL', key]);
      return (result as number) > 0;
    } catch {
      logger.error('Redis DEL failed', { key });
      return false;
    }
  }

  async deleteByTag(tag: string): Promise<number> {
    try {
      const keys = (await this.execute(['SMEMBERS', `tag:${tag}`])) as string[];
      if (!keys || keys.length === 0) return 0;

      const result = await this.execute(['DEL', ...keys, `tag:${tag}`]);
      return (result as number) - 1; // Minus the tag key itself
    } catch {
      logger.error('Redis deleteByTag failed', { tag });
      return 0;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.execute(['FLUSHDB']);
    } catch (error) {
      logger.error('Redis FLUSHDB failed', error);
    }
  }

  async keys(pattern: string = '*'): Promise<string[]> {
    try {
      const result = await this.execute(['KEYS', pattern]);
      return (result as string[]) || [];
    } catch {
      return [];
    }
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.token);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE CLIENT (UNIFIED INTERFACE)
// ═══════════════════════════════════════════════════════════════════════════════

class CacheClient {
  private redis: RedisCache;
  private memory: InMemoryCache;
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0, hitRate: 0 };
  private useRedis: boolean;

  constructor() {
    this.redis = new RedisCache();
    this.memory = new InMemoryCache();
    this.useRedis = this.redis.isConfigured();

    if (this.useRedis) {
      logger.info('Cache: Using Redis backend');
    } else {
      logger.info('Cache: Using in-memory backend (Redis not configured)');
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const prefixedKey = this.prefixKey(key);
    const value = this.useRedis
      ? await this.redis.get<T>(prefixedKey)
      : await this.memory.get<T>(prefixedKey);

    if (value !== null) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    this.updateHitRate();

    return value;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const prefixedKey = this.prefixKey(key);

    if (this.useRedis) {
      await this.redis.set(prefixedKey, value, options);
    } else {
      await this.memory.set(prefixedKey, value, options);
    }

    this.stats.sets++;
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    const prefixedKey = this.prefixKey(key);
    const result = this.useRedis
      ? await this.redis.delete(prefixedKey)
      : await this.memory.delete(prefixedKey);

    if (result) this.stats.deletes++;
    return result;
  }

  /**
   * Delete all keys with a specific tag
   */
  async invalidateTag(tag: string): Promise<number> {
    return this.useRedis
      ? await this.redis.deleteByTag(tag)
      : await this.memory.deleteByTag(tag);
  }

  /**
   * Get or set with callback (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Invalidate multiple keys by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const keys = this.useRedis
      ? await this.redis.keys(this.prefixKey(pattern))
      : await this.memory.keys(this.prefixKey(pattern));

    let deleted = 0;
    for (const key of keys) {
      const rawKey = key.replace(/^cache:/, '');
      if (await this.delete(rawKey)) deleted++;
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (this.useRedis) {
      await this.redis.clear();
    } else {
      await this.memory.clear();
    }
    this.resetStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Warm cache with pre-defined data
   */
  async warm(entries: Array<{ key: string; fetcher: () => Promise<unknown>; options?: CacheOptions }>): Promise<void> {
    logger.info('Cache warming started', { entries: entries.length });

    await Promise.all(
      entries.map(async ({ key, fetcher, options }) => {
        try {
          const value = await fetcher();
          await this.set(key, value, options);
        } catch (error) {
          logger.error('Cache warming failed for key', error, { key });
        }
      })
    );

    logger.info('Cache warming completed');
  }

  private prefixKey(key: string): string {
    return `cache:${key}`;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private resetStats(): void {
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, hitRate: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE KEYS HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const CacheKeys = {
  // User related
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:${id}:profile`,
  userWallet: (id: string) => `user:${id}:wallet`,
  userNFTs: (id: string) => `user:${id}:nfts`,

  // Collections
  collections: () => 'collections:all',
  collectionsFeatured: () => 'collections:featured',
  collectionsTrending: () => 'collections:trending',
  collection: (id: string) => `collection:${id}`,

  // NFTs
  nft: (id: string) => `nft:${id}`,
  nftsByCollection: (collectionId: string) => `nfts:collection:${collectionId}`,

  // Marketplace
  listings: () => 'listings:active',
  listingsByCollection: (collectionId: string) => `listings:collection:${collectionId}`,

  // Trading
  prices: () => 'prices:current',
  marketStats: () => 'market:stats',

  // API responses
  apiResponse: (path: string, params?: string) => `api:${path}${params ? `:${params}` : ''}`,
};

export const CacheTags = {
  USER: 'user',
  COLLECTIONS: 'collections',
  NFTS: 'nfts',
  LISTINGS: 'listings',
  PRICES: 'prices',
  TRADING: 'trading',
};

export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
};

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const cache = new CacheClient();

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default cache;
