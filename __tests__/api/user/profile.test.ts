/**
 * User Profile API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            email_confirmed_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            user_metadata: {
              full_name: 'Test User',
            },
          },
        },
        error: null,
      }),
    },
    signOut: vi.fn().mockResolvedValue({ error: null }),
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
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              user_id: 'user-123',
              full_name: 'Test User',
              avatar_url: null,
              preferred_language: 'ko',
              notification_settings: { email: true, push: true },
            },
            error: null,
          }),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              user_id: 'user-123',
              full_name: 'Updated Name',
              preferred_language: 'en',
            },
            error: null,
          }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  getClientIdentifier: vi.fn().mockReturnValue('127.0.0.1'),
  RateLimiters: { standard: 'standard', strict: 'strict' },
  rateLimitHeaders: vi.fn().mockReturnValue({}),
}));

describe('User Profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/user/profile', () => {
    it('should return user profile', async () => {
      const { GET } = await import('@/app/api/user/profile/route');

      const request = new Request('http://localhost:3000/api/user/profile', {
        method: 'GET',
      });

      const response = await GET(request as never);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.id).toBe('user-123');
      expect(json.email).toBe('test@example.com');
      expect(json.profile).toBeDefined();
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

      const { GET } = await import('@/app/api/user/profile/route');

      const request = new Request('http://localhost:3000/api/user/profile', {
        method: 'GET',
      });

      const response = await GET(request as never);
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/user/profile', () => {
    it('should update user profile', async () => {
      const { PATCH } = await import('@/app/api/user/profile/route');

      const request = new Request('http://localhost:3000/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Updated Name',
          preferred_language: 'en',
        }),
      });

      const response = await PATCH(request as never);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('should validate preferred_language', async () => {
      const { PATCH } = await import('@/app/api/user/profile/route');

      const request = new Request('http://localhost:3000/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_language: 'invalid',
        }),
      });

      const response = await PATCH(request as never);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toContain('preferred_language');
    });

    it('should validate full_name length', async () => {
      const { PATCH } = await import('@/app/api/user/profile/route');

      const request = new Request('http://localhost:3000/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'A', // Too short
        }),
      });

      const response = await PATCH(request as never);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toContain('full_name');
    });
  });

  describe('DELETE /api/user/profile', () => {
    it('should require authentication for delete', async () => {
      const { createServerClient } = await import('@supabase/ssr');
      vi.mocked(createServerClient).mockReturnValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
          signOut: vi.fn(),
        },
      } as never);

      const { DELETE } = await import('@/app/api/user/profile/route');

      const request = new Request('http://localhost:3000/api/user/profile', {
        method: 'DELETE',
      });

      const response = await DELETE(request as never);
      expect(response.status).toBe(401);
    });
  });
});
