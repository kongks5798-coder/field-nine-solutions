/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 59: CACHING MODULE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export {
  cache,
  CacheKeys,
  CacheTags,
  CacheTTL,
} from './cache-client';

export type {
  CacheOptions,
  CacheStats,
  CacheEntry,
} from './cache-client';

export { cache as default } from './cache-client';
