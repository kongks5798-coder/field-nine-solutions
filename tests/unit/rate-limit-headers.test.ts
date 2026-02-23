// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import { applyRateLimitHeaders, rateLimitExceeded } from '@/lib/rate-limit-headers';

describe('applyRateLimitHeaders', () => {
  const baseResult = { success: true, limit: 60, remaining: 55, resetAt: 1700000000000 };

  it('sets X-RateLimit-Limit header', () => {
    const res = NextResponse.json({ ok: true });
    applyRateLimitHeaders(res, baseResult);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('60');
  });

  it('sets X-RateLimit-Remaining header (clamped to 0 minimum)', () => {
    const res = NextResponse.json({ ok: true });
    applyRateLimitHeaders(res, { ...baseResult, remaining: -5 });
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('sets X-RateLimit-Reset header in seconds', () => {
    const res = NextResponse.json({ ok: true });
    applyRateLimitHeaders(res, baseResult);
    expect(res.headers.get('X-RateLimit-Reset')).toBe(String(Math.ceil(1700000000000 / 1000)));
  });

  it('returns the same response object', () => {
    const res = NextResponse.json({ ok: true });
    const returned = applyRateLimitHeaders(res, baseResult);
    expect(returned).toBe(res);
  });
});

describe('rateLimitExceeded', () => {
  it('returns 429 status', () => {
    const result = { success: false, limit: 60, remaining: 0, resetAt: Date.now() + 30000 };
    const res = rateLimitExceeded(result);
    expect(res.status).toBe(429);
  });

  it('includes Retry-After header', () => {
    const result = { success: false, limit: 60, remaining: 0, resetAt: Date.now() + 30000 };
    const res = rateLimitExceeded(result);
    const retryAfter = res.headers.get('Retry-After');
    expect(retryAfter).toBeTruthy();
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });

  it('includes error message in body', async () => {
    const result = { success: false, limit: 60, remaining: 0, resetAt: Date.now() + 30000 };
    const res = rateLimitExceeded(result);
    const body = await res.json();
    expect(body.error).toBe('Too many requests');
    expect(body.retryAfter).toBeGreaterThan(0);
  });

  it('includes rate limit headers on 429 response', () => {
    const result = { success: false, limit: 100, remaining: 0, resetAt: Date.now() + 60000 };
    const res = rateLimitExceeded(result);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('100');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
  });
});
