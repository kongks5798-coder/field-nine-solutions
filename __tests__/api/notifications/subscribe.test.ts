/**
 * Push Notification Subscription API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      }),
    },
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn().mockReturnValue([]),
  })),
}));

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  getClientIdentifier: vi.fn().mockReturnValue('127.0.0.1'),
  RateLimiters: { standard: 'standard' },
  rateLimitHeaders: vi.fn().mockReturnValue({}),
}));

describe('Push Notification Subscription API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/notifications/subscribe', () => {
    it('should successfully subscribe to push notifications', async () => {
      const { POST } = await import('@/app/api/notifications/subscribe/route');

      const request = new Request('http://localhost:3000/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://push.example.com/test',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key',
          },
        }),
      });

      const response = await POST(request as never);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('should require authentication', async () => {
      const { createServerClient } = await import('@supabase/ssr');
      vi.mocked(createServerClient).mockReturnValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      } as never);

      const { POST } = await import('@/app/api/notifications/subscribe/route');

      const request = new Request('http://localhost:3000/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://push.example.com/test',
          keys: { p256dh: 'key', auth: 'key' },
        }),
      });

      const response = await POST(request as never);
      expect(response.status).toBe(401);
    });

    it('should validate subscription data', async () => {
      const { POST } = await import('@/app/api/notifications/subscribe/route');

      const request = new Request('http://localhost:3000/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://push.example.com/test',
          // Missing keys
        }),
      });

      const response = await POST(request as never);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toContain('Invalid');
    });
  });

  describe('DELETE /api/notifications/subscribe', () => {
    it('should successfully unsubscribe', async () => {
      const { DELETE } = await import('@/app/api/notifications/subscribe/route');

      const request = new Request('http://localhost:3000/api/notifications/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://push.example.com/test',
        }),
      });

      const response = await DELETE(request as never);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('should require endpoint for unsubscribe', async () => {
      const { DELETE } = await import('@/app/api/notifications/subscribe/route');

      const request = new Request('http://localhost:3000/api/notifications/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await DELETE(request as never);
      expect(response.status).toBe(400);
    });
  });
});
