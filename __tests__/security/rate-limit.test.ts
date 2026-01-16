/**
 * Rate Limiter Tests
 * lib/security/rate-limit.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimiters,
  rateLimitHeaders,
  RateLimitConfig,
} from '@/lib/security/rate-limit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset time mocking between tests
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const config: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000,
        keyPrefix: 'test-allow',
      };

      const result = checkRateLimit('user-1', config);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should track multiple requests correctly', () => {
      const config: RateLimitConfig = {
        maxRequests: 3,
        windowMs: 60000,
        keyPrefix: 'test-track',
      };

      const result1 = checkRateLimit('user-track', config);
      const result2 = checkRateLimit('user-track', config);
      const result3 = checkRateLimit('user-track', config);

      expect(result1.remaining).toBe(2);
      expect(result2.remaining).toBe(1);
      expect(result3.remaining).toBe(0);
    });

    it('should block requests when limit exceeded', () => {
      const config: RateLimitConfig = {
        maxRequests: 2,
        windowMs: 60000,
        keyPrefix: 'test-block',
      };

      checkRateLimit('user-block', config);
      checkRateLimit('user-block', config);
      const result = checkRateLimit('user-block', config);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should isolate different users', () => {
      const config: RateLimitConfig = {
        maxRequests: 2,
        windowMs: 60000,
        keyPrefix: 'test-isolate',
      };

      checkRateLimit('user-a', config);
      checkRateLimit('user-a', config);
      const resultA = checkRateLimit('user-a', config);

      const resultB = checkRateLimit('user-b', config);

      expect(resultA.allowed).toBe(false);
      expect(resultB.allowed).toBe(true);
      expect(resultB.remaining).toBe(1);
    });

    it('should reset after window expires', async () => {
      vi.useFakeTimers();

      const config: RateLimitConfig = {
        maxRequests: 1,
        windowMs: 1000, // 1 second
        keyPrefix: 'test-reset',
      };

      const result1 = checkRateLimit('user-reset', config);
      expect(result1.allowed).toBe(true);

      const result2 = checkRateLimit('user-reset', config);
      expect(result2.allowed).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(1100);

      const result3 = checkRateLimit('user-reset', config);
      expect(result3.allowed).toBe(true);
    });

    it('should work without keyPrefix', () => {
      const config: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000,
      };

      const result = checkRateLimit('no-prefix-user', config);

      expect(result.allowed).toBe(true);
    });
  });

  describe('getClientIdentifier', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      const identifier = getClientIdentifier(request);

      expect(identifier).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-real-ip': '10.20.30.40',
        },
      });

      const identifier = getClientIdentifier(request);

      expect(identifier).toBe('10.20.30.40');
    });

    it('should extract IP from cf-connecting-ip header (Cloudflare)', () => {
      const request = new Request('https://example.com', {
        headers: {
          'cf-connecting-ip': '203.0.113.50',
        },
      });

      const identifier = getClientIdentifier(request);

      expect(identifier).toBe('203.0.113.50');
    });

    it('should prioritize x-forwarded-for over other headers', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '1.1.1.1',
          'x-real-ip': '2.2.2.2',
          'cf-connecting-ip': '3.3.3.3',
        },
      });

      const identifier = getClientIdentifier(request);

      expect(identifier).toBe('1.1.1.1');
    });

    it('should return "unknown" when no IP headers present', () => {
      const request = new Request('https://example.com');

      const identifier = getClientIdentifier(request);

      expect(identifier).toBe('unknown');
    });
  });

  describe('RateLimiters presets', () => {
    it('should have strict preset configured correctly', () => {
      expect(RateLimiters.strict.maxRequests).toBe(5);
      expect(RateLimiters.strict.windowMs).toBe(60000); // 1 minute
      expect(RateLimiters.strict.keyPrefix).toBe('strict');
    });

    it('should have auth preset configured correctly', () => {
      expect(RateLimiters.auth.maxRequests).toBe(10);
      expect(RateLimiters.auth.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(RateLimiters.auth.keyPrefix).toBe('auth');
    });

    it('should have standard preset configured correctly', () => {
      expect(RateLimiters.standard.maxRequests).toBe(100);
      expect(RateLimiters.standard.windowMs).toBe(60000); // 1 minute
      expect(RateLimiters.standard.keyPrefix).toBe('api');
    });

    it('should have burst preset configured correctly', () => {
      expect(RateLimiters.burst.maxRequests).toBe(30);
      expect(RateLimiters.burst.windowMs).toBe(10000); // 10 seconds
      expect(RateLimiters.burst.keyPrefix).toBe('burst');
    });
  });

  describe('rateLimitHeaders', () => {
    it('should generate correct headers for allowed request', () => {
      const result = {
        allowed: true,
        remaining: 4,
        resetTime: 1700000000000,
      };

      const headers = rateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('5');
      expect(headers['X-RateLimit-Remaining']).toBe('4');
      expect(headers['X-RateLimit-Reset']).toBe('1700000000');
      expect(headers['Retry-After']).toBeUndefined();
    });

    it('should include Retry-After header for blocked request', () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: 1700000060000,
        retryAfter: 60,
      };

      const headers = rateLimitHeaders(result);

      expect(headers['X-RateLimit-Remaining']).toBe('0');
      expect(headers['Retry-After']).toBe('60');
    });
  });
});
