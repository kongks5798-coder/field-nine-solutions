/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 59: SECURITY MODULE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export {
  rateLimiter,
  RateLimitPresets,
  DDoSPresets,
  getClientIP,
  generateKey,
  createRateLimitedResponse,
  addRateLimitHeaders,
  withRateLimit,
  rateLimitMiddleware,
  withRateLimitWrapper,
} from './rate-limiter';

export type {
  RateLimitConfig,
  RateLimitResult,
  RateLimitEntry,
  DDoSConfig,
} from './rate-limiter';

export { rateLimiter as default } from './rate-limiter';
