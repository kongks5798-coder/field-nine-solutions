// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimit, clearAllRateLimits } from '@/lib/rate-limit';

describe('rate-limit extended edge cases', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  it('remaining decrements from limit-1 down to 0', () => {
    const limit = 4;
    for (let i = 0; i < limit; i++) {
      const r = checkRateLimit('decrement-key', { limit, windowMs: 60000 });
      expect(r.remaining).toBe(limit - 1 - i);
      expect(r.success).toBe(true);
    }
    const over = checkRateLimit('decrement-key', { limit, windowMs: 60000 });
    expect(over.success).toBe(false);
    expect(over.remaining).toBe(0);
  });

  it('clearAllRateLimits resets all keys at once', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('clear-a', { limit: 3, windowMs: 60000 });
      checkRateLimit('clear-b', { limit: 3, windowMs: 60000 });
    }
    expect(checkRateLimit('clear-a', { limit: 3, windowMs: 60000 }).success).toBe(false);
    expect(checkRateLimit('clear-b', { limit: 3, windowMs: 60000 }).success).toBe(false);

    clearAllRateLimits();

    expect(checkRateLimit('clear-a', { limit: 3, windowMs: 60000 }).success).toBe(true);
    expect(checkRateLimit('clear-b', { limit: 3, windowMs: 60000 }).success).toBe(true);
  });

  it('resetRateLimit on non-existent key does not throw', () => {
    expect(() => resetRateLimit('non-existent')).not.toThrow();
  });

  it('resetAt is in the future relative to creation time', () => {
    const before = Date.now();
    const r = checkRateLimit('future-key', { limit: 10, windowMs: 5000 });
    expect(r.resetAt).toBeGreaterThanOrEqual(before + 5000);
  });

  it('limit of 1 allows exactly one request then blocks', () => {
    const r1 = checkRateLimit('one-key', { limit: 1, windowMs: 60000 });
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(0);

    const r2 = checkRateLimit('one-key', { limit: 1, windowMs: 60000 });
    expect(r2.success).toBe(false);
  });

  it('multiple blocked requests all report remaining=0', () => {
    checkRateLimit('multi-block', { limit: 1, windowMs: 60000 });

    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit('multi-block', { limit: 1, windowMs: 60000 });
      expect(r.success).toBe(false);
      expect(r.remaining).toBe(0);
    }
  });

  it('partial config merges with defaults correctly', () => {
    const r = checkRateLimit('partial-config', { limit: 10 });
    expect(r.limit).toBe(10);
    expect(r.resetAt).toBeGreaterThan(Date.now() + 50000);
  });
});
