/**
 * 재시도 로직 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { retryWithBackoff, isNetworkError } from '@/src/utils/retry';

describe('retryWithBackoff', () => {
  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('success');

    const result = await retryWithBackoff(fn, { maxRetries: 1, initialDelay: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw error after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Persistent error'));

    await expect(retryWithBackoff(fn, { maxRetries: 2, initialDelay: 10 })).rejects.toThrow(
      'Persistent error'
    );

    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});

describe('isNetworkError', () => {
  it('should identify network errors', () => {
    expect(isNetworkError(new Error('network error'))).toBe(true);
    expect(isNetworkError(new Error('fetch failed'))).toBe(true);
    expect(isNetworkError(new Error('timeout'))).toBe(true);
    expect(isNetworkError(new Error('ECONNREFUSED'))).toBe(true);
  });

  it('should not identify non-network errors', () => {
    expect(isNetworkError(new Error('validation error'))).toBe(false);
    expect(isNetworkError(new Error('permission denied'))).toBe(false);
  });
});
