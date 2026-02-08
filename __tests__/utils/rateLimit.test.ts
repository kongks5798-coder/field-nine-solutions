/**
 * Rate Limiting 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, cleanupRateLimit } from '@/src/utils/rateLimit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Clean up before each test
    cleanupRateLimit();
  });

  it('should allow requests within limit', () => {
    const key = 'test-key';

    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(key, 10, 60000)).toBe(true);
    }
  });

  it('should block requests exceeding limit', () => {
    const key = 'test-key';

    // Make 10 requests (within limit)
    for (let i = 0; i < 10; i++) {
      checkRateLimit(key, 10, 60000);
    }

    // 11th request should be blocked
    expect(checkRateLimit(key, 10, 60000)).toBe(false);
  });

  it('should reset after time window', async () => {
    vi.useFakeTimers();

    const key = 'test-key-reset';

    // Make one request
    expect(checkRateLimit(key, 1, 100)).toBe(true);

    // Second request should be blocked
    expect(checkRateLimit(key, 1, 100)).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(150);

    // Should be allowed again
    expect(checkRateLimit(key, 1, 100)).toBe(true);

    vi.useRealTimers();
  });
});
