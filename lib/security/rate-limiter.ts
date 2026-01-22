/**
 * K-UNIVERSAL Production Rate Limiter
 * Persistent rate limiting using Supabase
 *
 * Features:
 * - Supabase-based persistent storage
 * - Multiple identifier types (user, IP, API key)
 * - Configurable windows and limits
 * - Automatic cleanup of expired windows
 * - Fallback to in-memory when DB unavailable
 *
 * @module lib/security/rate-limiter
 */

import { supabaseAdmin } from '@/lib/supabase/server';
import { logger } from '@/lib/logging/logger';

// ============================================
// Types
// ============================================

export type IdentifierType = 'user' | 'ip' | 'api_key' | 'combined';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
  identifierType?: IdentifierType;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  blocked: boolean;
  blockedUntil?: Date;
  retryAfterMs?: number;
}

export interface RateLimitRecord {
  id: string;
  identifier_type: IdentifierType;
  identifier_value: string;
  endpoint: string;
  request_count: number;
  window_start: string;
  window_end: string;
  max_requests: number;
  is_blocked: boolean;
  blocked_until: string | null;
}

// ============================================
// Default Configurations
// ============================================

export const RATE_LIMIT_PRESETS = {
  // Standard API endpoints
  standard: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    identifierType: 'combined' as IdentifierType,
  },

  // Strict for sensitive endpoints
  strict: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 15 * 60 * 1000, // 15 minutes block
    identifierType: 'combined' as IdentifierType,
  },

  // Auth endpoints
  auth: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 30 * 60 * 1000, // 30 minutes block
    identifierType: 'ip' as IdentifierType,
  },

  // Payment endpoints
  payment: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 10 * 60 * 1000, // 10 minutes block
    identifierType: 'user' as IdentifierType,
  },

  // Webhook endpoints (high limit)
  webhook: {
    maxRequests: 1000,
    windowMs: 60 * 1000, // 1 minute
    identifierType: 'ip' as IdentifierType,
  },

  // Search endpoints
  search: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    identifierType: 'combined' as IdentifierType,
  },
};

// ============================================
// In-Memory Fallback Store
// ============================================

const memoryStore = new Map<string, {
  count: number;
  windowStart: number;
  windowEnd: number;
  blocked: boolean;
  blockedUntil?: number;
}>();

// Cleanup memory store periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (record.windowEnd < now && (!record.blocked || (record.blockedUntil && record.blockedUntil < now))) {
        memoryStore.delete(key);
      }
    }
  }, 60 * 1000); // Every minute
}

// ============================================
// Core Rate Limiter Class
// ============================================

export class RateLimiter {
  private config: Required<RateLimitConfig>;
  private endpoint: string;
  private useDatabase: boolean = true;

  constructor(endpoint: string, config: RateLimitConfig) {
    this.endpoint = endpoint;
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      blockDurationMs: config.blockDurationMs || 0,
      identifierType: config.identifierType || 'combined',
    };
  }

  /**
   * Check rate limit and increment counter
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const key = this.buildKey(identifier);

    try {
      // Try database first
      return await this.checkDatabase(identifier, now);
    } catch (error) {
      logger.warn('rate_limiter_db_fallback', {
        endpoint: this.endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to memory
      this.useDatabase = false;
      return this.checkMemory(key, now);
    }
  }

  /**
   * Check using Supabase database
   */
  private async checkDatabase(identifier: string, now: number): Promise<RateLimitResult> {
    const windowEnd = new Date(now + this.config.windowMs);

    // Get or create rate limit record
    const { data: existing, error: selectError } = await supabaseAdmin
      .from('rate_limits')
      .select('*')
      .eq('identifier_type', this.config.identifierType)
      .eq('identifier_value', identifier)
      .eq('endpoint', this.endpoint)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    // Check if blocked
    if (existing?.is_blocked && existing.blocked_until) {
      const blockedUntil = new Date(existing.blocked_until);
      if (blockedUntil > new Date(now)) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: blockedUntil,
          blocked: true,
          blockedUntil,
          retryAfterMs: blockedUntil.getTime() - now,
        };
      }
      // Block expired, reset
      await this.resetRecord(existing.id);
    }

    // Check if window expired
    if (existing && new Date(existing.window_end) < new Date(now)) {
      // Window expired, reset count
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('rate_limits')
        .update({
          request_count: 1,
          window_start: new Date(now).toISOString(),
          window_end: windowEnd.toISOString(),
          is_blocked: false,
          blocked_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: windowEnd,
        blocked: false,
      };
    }

    // Existing active window
    if (existing) {
      const newCount = existing.request_count + 1;

      if (newCount > this.config.maxRequests) {
        // Exceeded limit
        if (this.config.blockDurationMs > 0) {
          // Block the identifier
          const blockedUntil = new Date(now + this.config.blockDurationMs);

          await supabaseAdmin
            .from('rate_limits')
            .update({
              is_blocked: true,
              blocked_until: blockedUntil.toISOString(),
              block_reason: `Exceeded ${this.config.maxRequests} requests in window`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          logger.warn('rate_limit_blocked', {
            identifier,
            endpoint: this.endpoint,
            blockedUntil: blockedUntil.toISOString(),
          });

          return {
            allowed: false,
            remaining: 0,
            resetAt: blockedUntil,
            blocked: true,
            blockedUntil,
            retryAfterMs: this.config.blockDurationMs,
          };
        }

        // No block, just reject
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(existing.window_end),
          blocked: false,
          retryAfterMs: new Date(existing.window_end).getTime() - now,
        };
      }

      // Increment counter
      await supabaseAdmin
        .from('rate_limits')
        .update({
          request_count: newCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      return {
        allowed: true,
        remaining: this.config.maxRequests - newCount,
        resetAt: new Date(existing.window_end),
        blocked: false,
      };
    }

    // Create new record
    const { error: insertError } = await supabaseAdmin
      .from('rate_limits')
      .insert({
        identifier_type: this.config.identifierType,
        identifier_value: identifier,
        endpoint: this.endpoint,
        request_count: 1,
        window_start: new Date(now).toISOString(),
        window_end: windowEnd.toISOString(),
        max_requests: this.config.maxRequests,
        is_blocked: false,
      });

    if (insertError) throw insertError;

    return {
      allowed: true,
      remaining: this.config.maxRequests - 1,
      resetAt: windowEnd,
      blocked: false,
    };
  }

  /**
   * Check using in-memory store (fallback)
   */
  private checkMemory(key: string, now: number): RateLimitResult {
    const record = memoryStore.get(key);
    const windowEnd = now + this.config.windowMs;

    // Check if blocked
    if (record?.blocked && record.blockedUntil && record.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(record.blockedUntil),
        blocked: true,
        blockedUntil: new Date(record.blockedUntil),
        retryAfterMs: record.blockedUntil - now,
      };
    }

    // Check if window expired
    if (!record || record.windowEnd < now) {
      memoryStore.set(key, {
        count: 1,
        windowStart: now,
        windowEnd,
        blocked: false,
      });

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: new Date(windowEnd),
        blocked: false,
      };
    }

    // Check limit
    const newCount = record.count + 1;

    if (newCount > this.config.maxRequests) {
      if (this.config.blockDurationMs > 0) {
        const blockedUntil = now + this.config.blockDurationMs;
        record.blocked = true;
        record.blockedUntil = blockedUntil;
        memoryStore.set(key, record);

        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(blockedUntil),
          blocked: true,
          blockedUntil: new Date(blockedUntil),
          retryAfterMs: this.config.blockDurationMs,
        };
      }

      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(record.windowEnd),
        blocked: false,
        retryAfterMs: record.windowEnd - now,
      };
    }

    // Increment
    record.count = newCount;
    memoryStore.set(key, record);

    return {
      allowed: true,
      remaining: this.config.maxRequests - newCount,
      resetAt: new Date(record.windowEnd),
      blocked: false,
    };
  }

  /**
   * Reset a rate limit record
   */
  private async resetRecord(id: string): Promise<void> {
    await supabaseAdmin
      .from('rate_limits')
      .update({
        request_count: 0,
        is_blocked: false,
        blocked_until: null,
        block_reason: null,
        window_start: new Date().toISOString(),
        window_end: new Date(Date.now() + this.config.windowMs).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  /**
   * Build storage key
   */
  private buildKey(identifier: string): string {
    return `${this.config.identifierType}:${identifier}:${this.endpoint}`;
  }
}

// ============================================
// Factory Functions
// ============================================

/**
 * Create a rate limiter for an endpoint
 */
export function createRateLimiter(
  endpoint: string,
  config: RateLimitConfig | keyof typeof RATE_LIMIT_PRESETS
): RateLimiter {
  const resolvedConfig = typeof config === 'string'
    ? RATE_LIMIT_PRESETS[config]
    : config;

  return new RateLimiter(endpoint, resolvedConfig);
}

/**
 * Extract identifier from request
 */
export function extractIdentifier(
  request: Request,
  type: IdentifierType,
  userId?: string
): string {
  const headers = request.headers;
  const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headers.get('x-real-ip')
    || 'unknown';

  switch (type) {
    case 'user':
      return userId || 'anonymous';
    case 'ip':
      return ip;
    case 'api_key':
      return headers.get('x-api-key') || 'no-key';
    case 'combined':
    default:
      return `${userId || 'anon'}_${ip}`;
  }
}

// ============================================
// Middleware Helper
// ============================================

export interface RateLimitMiddlewareOptions {
  config: RateLimitConfig | keyof typeof RATE_LIMIT_PRESETS;
  getUserId?: (request: Request) => Promise<string | undefined>;
}

/**
 * Rate limit middleware for API routes
 */
export async function rateLimitMiddleware(
  request: Request,
  endpoint: string,
  options: RateLimitMiddlewareOptions
): Promise<{
  allowed: boolean;
  result: RateLimitResult;
  headers: Record<string, string>;
}> {
  const limiter = createRateLimiter(endpoint, options.config);
  const config = typeof options.config === 'string'
    ? RATE_LIMIT_PRESETS[options.config]
    : options.config;

  const userId = options.getUserId ? await options.getUserId(request) : undefined;
  const identifier = extractIdentifier(request, config.identifierType || 'combined', userId);

  const result = await limiter.check(identifier);

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  };

  if (!result.allowed) {
    headers['Retry-After'] = String(Math.ceil((result.retryAfterMs || 0) / 1000));
  }

  return { allowed: result.allowed, result, headers };
}
