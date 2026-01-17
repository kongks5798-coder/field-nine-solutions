/**
 * Wallet Refund API Tests
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
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'tx-123',
              wallet_id: 'wallet-123',
              user_id: 'user-123',
              amount: 10000,
              status: 'completed',
              reference_id: 'pk_test_123',
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

vi.mock('@/lib/toss/client', () => ({
  getPaymentInfo: vi.fn().mockResolvedValue({
    paymentKey: 'pk_test_123',
    status: 'DONE',
    totalAmount: 10000,
  }),
  cancelPayment: vi.fn().mockResolvedValue({
    success: true,
    paymentKey: 'pk_test_123',
    status: 'CANCELED',
  }),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  getClientIdentifier: vi.fn().mockReturnValue('127.0.0.1'),
  RateLimiters: { strict: 'strict' },
  rateLimitHeaders: vi.fn().mockReturnValue({}),
}));

describe('Wallet Refund API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/wallet/refund', () => {
    it('should require paymentKey and cancelReason', async () => {
      const { POST } = await import('@/app/api/wallet/refund/route');

      const request = new Request('http://localhost:3000/api/wallet/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request as never);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toContain('required');
    });

    it('should validate cancelReason length', async () => {
      const { POST } = await import('@/app/api/wallet/refund/route');

      const request = new Request('http://localhost:3000/api/wallet/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey: 'pk_test_123',
          cancelReason: 'ab', // Too short
        }),
      });

      const response = await POST(request as never);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toContain('5 and 200 characters');
    });

    it('should successfully process refund', async () => {
      const { POST } = await import('@/app/api/wallet/refund/route');

      const request = new Request('http://localhost:3000/api/wallet/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey: 'pk_test_123',
          cancelReason: '고객 요청으로 인한 환불',
        }),
      });

      const response = await POST(request as never);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.refundAmount).toBe(10000);
    });

    it('should handle rate limiting', async () => {
      const { checkRateLimit } = await import('@/lib/security/rate-limit');
      vi.mocked(checkRateLimit).mockReturnValueOnce({
        allowed: false,
        retryAfter: 60,
        remaining: 0,
        resetTime: Date.now() + 60000,
      });

      const { POST } = await import('@/app/api/wallet/refund/route');

      const request = new Request('http://localhost:3000/api/wallet/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey: 'pk_test_123',
          cancelReason: '환불 테스트',
        }),
      });

      const response = await POST(request as never);
      expect(response.status).toBe(429);
    });

    it('should reject unauthorized refund requests', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase/server');
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'tx-123',
                wallet_id: 'wallet-123',
                user_id: 'different-user', // Different user
                amount: 10000,
                status: 'completed',
                reference_id: 'pk_test_123',
              },
              error: null,
            }),
          })),
        })),
      } as never);

      const { POST } = await import('@/app/api/wallet/refund/route');

      const request = new Request('http://localhost:3000/api/wallet/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey: 'pk_test_123',
          cancelReason: '환불 테스트',
        }),
      });

      const response = await POST(request as never);
      expect(response.status).toBe(403);
    });

    it('should reject already refunded transactions', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase/server');
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'tx-123',
                wallet_id: 'wallet-123',
                user_id: 'user-123',
                amount: 10000,
                status: 'refunded', // Already refunded
                reference_id: 'pk_test_123',
              },
              error: null,
            }),
          })),
        })),
      } as never);

      const { POST } = await import('@/app/api/wallet/refund/route');

      const request = new Request('http://localhost:3000/api/wallet/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey: 'pk_test_123',
          cancelReason: '환불 테스트',
        }),
      });

      const response = await POST(request as never);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toContain('already been refunded');
    });

    it('should support partial refunds', async () => {
      const { POST } = await import('@/app/api/wallet/refund/route');

      const request = new Request('http://localhost:3000/api/wallet/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey: 'pk_test_123',
          cancelReason: '부분 환불 요청',
          cancelAmount: 5000, // Partial refund
        }),
      });

      const response = await POST(request as never);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.refundAmount).toBe(5000);
    });

    it('should reject refund amount exceeding original amount', async () => {
      const { POST } = await import('@/app/api/wallet/refund/route');

      const request = new Request('http://localhost:3000/api/wallet/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey: 'pk_test_123',
          cancelReason: '환불 테스트',
          cancelAmount: 50000, // More than original
        }),
      });

      const response = await POST(request as never);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toContain('exceed');
    });
  });
});
