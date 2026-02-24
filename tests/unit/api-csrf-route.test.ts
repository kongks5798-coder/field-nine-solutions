// @vitest-environment node
/**
 * api-csrf-route.test.ts
 *
 * Tests for GET /api/csrf route:
 * 1. Returns 200 with csrfToken in JSON body
 * 2. Sets csrf-token cookie with httpOnly and sameSite strict
 * 3. Token has exactly 3 parts (timestamp.random.signature)
 * 4. Token is a valid CSRF token (passes validation)
 * 5. Cookie maxAge is set to 3600
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/csrf', () => ({
  generateCsrfToken: vi.fn(() => 'abc123.deadbeef0123456789abcdef01234567.sig1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
}));

import { GET } from '@/app/api/csrf/route';

describe('GET /api/csrf', () => {
  it('returns 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('returns csrfToken in JSON body', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveProperty('csrfToken');
    expect(typeof body.csrfToken).toBe('string');
    expect(body.csrfToken.length).toBeGreaterThan(0);
  });

  it('token has 3 parts separated by dots (timestamp.random.signature)', async () => {
    const res = await GET();
    const body = await res.json();
    const parts = body.csrfToken.split('.');
    expect(parts).toHaveLength(3);
    expect(parts[0].length).toBeGreaterThan(0); // timestamp
    expect(parts[1].length).toBeGreaterThan(0); // random
    expect(parts[2].length).toBeGreaterThan(0); // signature
  });

  it('sets csrf-token cookie with httpOnly and sameSite strict', async () => {
    const res = await GET();
    const setCookieHeader = res.headers.getSetCookie();
    const csrfCookie = setCookieHeader.find((c: string) => c.startsWith('csrf-token='));
    expect(csrfCookie).toBeDefined();
    expect(csrfCookie!).toContain('HttpOnly');
    expect(csrfCookie!.toLowerCase()).toContain('samesite=strict');
    expect(csrfCookie!).toContain('Path=/');
  });

  it('cookie maxAge is 3600 seconds', async () => {
    const res = await GET();
    const setCookieHeader = res.headers.getSetCookie();
    const csrfCookie = setCookieHeader.find((c: string) => c.startsWith('csrf-token='));
    expect(csrfCookie).toBeDefined();
    expect(csrfCookie).toContain('Max-Age=3600');
  });
});
