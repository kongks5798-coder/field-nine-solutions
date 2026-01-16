/**
 * Rate Limiter for API Protection
 * 인메모리 기반 요청 제한 (Production: Redis 사용 권장)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory storage (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;    // Maximum requests allowed
  windowMs: number;       // Time window in milliseconds
  keyPrefix?: string;     // Prefix for the key
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;    // Seconds until reset (if not allowed)
}

/**
 * Check and update rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  // If no entry or entry has expired, create new one
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // Increment counter
  entry.count++;

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client identifier from request
 * Uses IP address or falls back to a hash of user-agent
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = forwardedFor?.split(',')[0]?.trim() ||
             cfConnectingIp ||
             realIp ||
             'unknown';

  return ip;
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const RateLimiters = {
  // Strict: For payment and sensitive operations
  strict: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 requests per minute
    keyPrefix: 'strict',
  } as RateLimitConfig,

  // Auth: For login/signup attempts
  auth: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 10 requests per 15 minutes
    keyPrefix: 'auth',
  } as RateLimitConfig,

  // Standard: For regular API endpoints
  standard: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 100 requests per minute
    keyPrefix: 'api',
  } as RateLimitConfig,

  // Burst: For endpoints that might have legitimate bursts
  burst: {
    maxRequests: 30,
    windowMs: 10 * 1000, // 30 requests per 10 seconds
    keyPrefix: 'burst',
  } as RateLimitConfig,
};

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.remaining + (result.allowed ? 1 : 0)),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000)),
    ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {}),
  };
}
