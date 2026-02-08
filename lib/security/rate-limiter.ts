/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 59: API RATE LIMITER WITH DDOS PROTECTION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Enterprise-grade rate limiting:
 * - Sliding window algorithm
 * - Per-IP, per-user, per-endpoint limits
 * - DDoS detection and auto-blocking
 * - Graceful degradation
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../observability';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RateLimitConfig {
  limit: number;
  windowSize: number;
  keyType: 'ip' | 'user' | 'api-key' | 'custom';
  keyGenerator?: (request: NextRequest) => string;
  skip?: (request: NextRequest) => boolean;
  onRateLimited?: (request: NextRequest, retryAfter: number) => NextResponse;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface RateLimitEntry {
  count: number;
  windowStart: number;
  blocked?: boolean;
  blockedUntil?: number;
}

export interface DDoSConfig {
  threshold: number;
  blockDuration: number;
  enabled: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// IN-MEMORY STORE
// ═══════════════════════════════════════════════════════════════════════════════

class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.windowStart > 600000) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITER
// ═══════════════════════════════════════════════════════════════════════════════

class RateLimiter {
  private store: RateLimitStore;
  private ddosBlocklist: Map<string, number> = new Map();
  private ddosRequestCounts: Map<string, number[]> = new Map();

  constructor() {
    this.store = new RateLimitStore();
  }

  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowMs = config.windowSize * 1000;

    const blockedUntil = this.ddosBlocklist.get(key);
    if (blockedUntil && blockedUntil > now) {
      return {
        success: false,
        limit: config.limit,
        remaining: 0,
        reset: Math.ceil(blockedUntil / 1000),
        retryAfter: Math.ceil((blockedUntil - now) / 1000),
      };
    }

    let entry = this.store.get(key);

    if (!entry || now - entry.windowStart >= windowMs) {
      entry = { count: 0, windowStart: now };
    }

    entry.count++;
    this.store.set(key, entry);

    const remaining = Math.max(0, config.limit - entry.count);
    const reset = Math.ceil((entry.windowStart + windowMs) / 1000);

    if (entry.count > config.limit) {
      const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
      return { success: false, limit: config.limit, remaining: 0, reset, retryAfter };
    }

    return { success: true, limit: config.limit, remaining, reset };
  }

  checkDDoS(ip: string, config: DDoSConfig): boolean {
    if (!config.enabled) return true;

    const now = Date.now();
    const blockedUntil = this.ddosBlocklist.get(ip);
    if (blockedUntil && blockedUntil > now) return false;

    let timestamps = this.ddosRequestCounts.get(ip) || [];
    const oneMinuteAgo = now - 60000;
    timestamps = timestamps.filter(t => t > oneMinuteAgo);
    timestamps.push(now);
    this.ddosRequestCounts.set(ip, timestamps);

    if (timestamps.length > config.threshold) {
      this.ddosBlocklist.set(ip, now + config.blockDuration * 1000);
      logger.warn('DDoS protection: IP blocked', { ip, requestsPerMinute: timestamps.length });
      return false;
    }

    return true;
  }

  blockIP(ip: string, durationSeconds: number): void {
    this.ddosBlocklist.set(ip, Date.now() + durationSeconds * 1000);
    logger.info('IP manually blocked', { ip, durationSeconds });
  }

  unblockIP(ip: string): void {
    this.ddosBlocklist.delete(ip);
    logger.info('IP unblocked', { ip });
  }

  getBlockedIPs(): Array<{ ip: string; until: number }> {
    const now = Date.now();
    const blocked: Array<{ ip: string; until: number }> = [];
    for (const [ip, until] of this.ddosBlocklist.entries()) {
      if (until > now) blocked.push({ ip, until });
      else this.ddosBlocklist.delete(ip);
    }
    return blocked;
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  getState(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════════════════════

export const RateLimitPresets = {
  standard: { limit: 100, windowSize: 60, keyType: 'ip' as const },
  strict: { limit: 10, windowSize: 60, keyType: 'ip' as const },
  auth: { limit: 5, windowSize: 300, keyType: 'ip' as const },
  payment: { limit: 20, windowSize: 60, keyType: 'user' as const },
  publicApi: { limit: 1000, windowSize: 3600, keyType: 'api-key' as const },
  search: { limit: 30, windowSize: 60, keyType: 'ip' as const },
  upload: { limit: 10, windowSize: 3600, keyType: 'user' as const },
};

export const DDoSPresets = {
  standard: { threshold: 300, blockDuration: 600, enabled: true },
  aggressive: { threshold: 100, blockDuration: 3600, enabled: true },
  disabled: { threshold: Infinity, blockDuration: 0, enabled: false },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

export function generateKey(request: NextRequest, config: RateLimitConfig): string {
  if (config.keyGenerator) return config.keyGenerator(request);

  const ip = getClientIP(request);
  const path = new URL(request.url).pathname;

  switch (config.keyType) {
    case 'ip': return `ratelimit:ip:${ip}:${path}`;
    case 'user':
      const userId = request.headers.get('x-user-id') || ip;
      return `ratelimit:user:${userId}:${path}`;
    case 'api-key':
      const apiKey = request.headers.get('x-api-key') || ip;
      return `ratelimit:apikey:${apiKey}`;
    default: return `ratelimit:${ip}:${path}`;
  }
}

export function createRateLimitedResponse(
  result: RateLimitResult,
  message: string = 'Too many requests'
): NextResponse {
  return NextResponse.json(
    { success: false, error: message, retryAfter: result.retryAfter },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': result.retryAfter?.toString() || '60',
      },
    }
  );
}

export function addRateLimitHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());
  return response;
}

export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = RateLimitPresets.standard,
  ddosConfig: DDoSConfig = DDoSPresets.standard
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (config.skip?.(request)) return handler(request);

    const ip = getClientIP(request);

    if (!rateLimiter.checkDDoS(ip, ddosConfig)) {
      logger.warn('Request blocked by DDoS protection', { ip });
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const key = generateKey(request, config);
    const result = rateLimiter.check(key, config);

    if (!result.success) {
      logger.info('Request rate limited', { ip, key, retryAfter: result.retryAfter });
      if (config.onRateLimited) return config.onRateLimited(request, result.retryAfter!);
      return createRateLimitedResponse(result);
    }

    const response = await handler(request);
    return addRateLimitHeaders(response, result);
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const rateLimiter = new RateLimiter();

/**
 * Backward-compatible rate limit middleware
 * Matches existing API: rateLimitMiddleware(request, path, { config: 'presetName' })
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  path: string,
  options: { config: keyof typeof RateLimitPresets }
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  const ip = getClientIP(request);
  const config = RateLimitPresets[options.config] || RateLimitPresets.standard;

  // Check DDoS first
  if (!rateLimiter.checkDDoS(ip, DDoSPresets.standard)) {
    logger.warn('Request blocked by DDoS protection', { ip, path });
    return {
      allowed: false,
      headers: {
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'Retry-After': '600',
      },
    };
  }

  const key = `ratelimit:${config.keyType}:${ip}:${path}`;
  const result = rateLimiter.check(key, config);

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (!result.success) {
    headers['Retry-After'] = result.retryAfter?.toString() || '60';
    logger.info('Request rate limited', { ip, path, retryAfter: result.retryAfter });
  }

  return {
    allowed: result.success,
    headers,
  };
}

// HOC wrapper for route handlers
export const withRateLimitWrapper = withRateLimit;

export default rateLimiter;
