/**
 * Wallet Topup API Tests
 * app/api/wallet/topup/route.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the dependencies
vi.mock('@/lib/toss/client', () => ({
  confirmPayment: vi.fn(),
  generateOrderId: vi.fn(() => 'ORDER_TEST_123'),
  validateTossConfig: vi.fn(() => ({ valid: true, errors: [] })),
}));

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 4, resetTime: Date.now() + 60000 })),
  getClientIdentifier: vi.fn(() => '127.0.0.1'),
  RateLimiters: {
    strict: { maxRequests: 5, windowMs: 60000, keyPrefix: 'strict' },
  },
  rateLimitHeaders: vi.fn(() => ({})),
}));

import { POST, GET } from '@/app/api/wallet/topup/route';
import { confirmPayment, validateTossConfig } from '@/lib/toss/client';
import { supabaseAdmin } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rate-limit';

describe('Wallet Topup API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/wallet/topup', () => {
    it('should return a new order ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/wallet/topup');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.orderId).toBe('ORDER_TEST_123');
    });
  });

  describe('POST /api/wallet/topup', () => {
    const createRequest = (body: object) => {
      return new NextRequest('http://localhost:3000/api/wallet/topup', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    };

    it('should return 429 when rate limited', async () => {
      vi.mocked(checkRateLimit).mockReturnValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      });

      const request = createRequest({
        paymentKey: 'test-key',
        orderId: 'ORDER_123',
        amount: 10000,
        userId: 'user-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('요청');
    });

    it('should return 503 when Toss is not configured', async () => {
      vi.mocked(validateTossConfig).mockReturnValueOnce({
        valid: false,
        errors: ['TOSS_SECRET_KEY is not configured'],
      });

      const request = createRequest({
        paymentKey: 'test-key',
        orderId: 'ORDER_123',
        amount: 10000,
        userId: 'user-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
    });

    it('should return 400 when required parameters are missing', async () => {
      const request = createRequest({
        // Missing paymentKey, orderId, amount
        userId: 'user-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('파라미터');
    });

    it('should return 400 when amount is below minimum', async () => {
      const request = createRequest({
        paymentKey: 'test-key',
        orderId: 'ORDER_123',
        amount: 500, // Below 1000 minimum
        userId: 'user-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('금액');
    });

    it('should return 400 when amount exceeds maximum', async () => {
      const request = createRequest({
        paymentKey: 'test-key',
        orderId: 'ORDER_123',
        amount: 100000000, // Above 10,000,000 maximum
        userId: 'user-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('금액');
    });

    it('should return 400 when userId is missing', async () => {
      const request = createRequest({
        paymentKey: 'test-key',
        orderId: 'ORDER_123',
        amount: 10000,
        // Missing userId
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('사용자');
    });

    it('should handle duplicate payment (idempotency)', async () => {
      // Mock existing transaction found
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'tx-123', status: 'completed', amount: 10000 },
              error: null,
            }),
          }),
        }),
      } as any);

      const request = createRequest({
        paymentKey: 'already-processed-key',
        orderId: 'ORDER_123',
        amount: 10000,
        userId: 'user-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.duplicate).toBe(true);
    });

    it('should return 400 when Toss payment fails', async () => {
      // No existing transaction
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      } as any);

      vi.mocked(confirmPayment).mockResolvedValueOnce({
        success: false,
        error: '결제 승인 실패',
      });

      const request = createRequest({
        paymentKey: 'test-key',
        orderId: 'ORDER_123',
        amount: 10000,
        userId: 'user-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('실패');
    });

    it('should return 400 when amount mismatch detected', async () => {
      // No existing transaction
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      } as any);

      // Toss returns different amount
      vi.mocked(confirmPayment).mockResolvedValueOnce({
        success: true,
        paymentKey: 'pk_123',
        orderId: 'ORDER_123',
        totalAmount: 5000, // Different from requested 10000
        status: 'DONE',
        method: 'CARD',
      });

      const request = createRequest({
        paymentKey: 'test-key',
        orderId: 'ORDER_123',
        amount: 10000,
        userId: 'user-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('금액');
    });

    it('should return 404 when wallet not found', async () => {
      // Mock: no existing transaction
      const fromMock = vi.fn();
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });
      // Mock: wallet not found
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      vi.mocked(supabaseAdmin.from).mockImplementation(fromMock);

      vi.mocked(confirmPayment).mockResolvedValueOnce({
        success: true,
        paymentKey: 'pk_123',
        orderId: 'ORDER_123',
        totalAmount: 10000,
        status: 'DONE',
        method: 'CARD',
      });

      const request = createRequest({
        paymentKey: 'test-key',
        orderId: 'ORDER_123',
        amount: 10000,
        userId: 'user-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('지갑');
    });

    it('should successfully process topup', async () => {
      const fromMock = vi.fn();

      // Mock: no existing transaction
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      // Mock: wallet found
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'wallet-123', balance: 5000 },
              error: null,
            }),
          }),
        }),
      });

      // Mock: update wallet
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      // Mock: insert transaction
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      // Mock: get final balance
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { balance: 15000 },
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabaseAdmin.from).mockImplementation(fromMock);

      vi.mocked(confirmPayment).mockResolvedValueOnce({
        success: true,
        paymentKey: 'pk_123',
        orderId: 'ORDER_123',
        totalAmount: 10000,
        status: 'DONE',
        method: 'CARD',
      });

      const request = createRequest({
        paymentKey: 'test-key',
        orderId: 'ORDER_123',
        amount: 10000,
        userId: 'user-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.amount).toBe(10000);
      expect(data.message).toContain('완료');
    });
  });
});
