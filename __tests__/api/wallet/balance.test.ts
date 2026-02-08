/**
 * Wallet Balance API Tests
 * app/api/wallet/balance/route.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 99, resetTime: Date.now() + 60000 })),
  getClientIdentifier: vi.fn(() => '127.0.0.1'),
  RateLimiters: {
    standard: { maxRequests: 100, windowMs: 60000, keyPrefix: 'api' },
  },
  rateLimitHeaders: vi.fn(() => ({})),
}));

import { GET } from '@/app/api/wallet/balance/route';
import { supabaseAdmin } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rate-limit';

describe('Wallet Balance API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/wallet/balance', () => {
    it('should return 429 when rate limited', async () => {
      vi.mocked(checkRateLimit).mockReturnValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/wallet/balance?userId=user-123'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
    });

    it('should return 400 when userId is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/wallet/balance'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('사용자');
    });

    it('should return default values when wallet not found', async () => {
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

      const request = new NextRequest(
        'http://localhost:3000/api/wallet/balance?userId=new-user'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.wallet.balance).toBe(0);
      expect(data.wallet.currency).toBe('KRW');
      expect(data.wallet.hasVirtualCard).toBe(false);
      expect(data.transactions).toEqual([]);
    });

    it('should return wallet and transactions when found', async () => {
      const mockWallet = {
        id: 'wallet-123',
        balance: 50000,
        currency: 'KRW',
        has_virtual_card: true,
        card_last_four: '1234',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockTransactions = [
        {
          id: 'tx-1',
          type: 'topup',
          amount: 30000,
          currency: 'KRW',
          status: 'completed',
          description: '충전',
          merchant_name: null,
          merchant_category: null,
          created_at: '2024-01-01T10:00:00Z',
        },
        {
          id: 'tx-2',
          type: 'payment',
          amount: -5000,
          currency: 'KRW',
          status: 'completed',
          description: '결제',
          merchant_name: 'Test Store',
          merchant_category: 'retail',
          created_at: '2024-01-01T12:00:00Z',
        },
      ];

      const fromMock = vi.fn();

      // First call - wallet
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockWallet,
              error: null,
            }),
          }),
        }),
      });

      // Second call - transactions
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        }),
      });

      vi.mocked(supabaseAdmin.from).mockImplementation(fromMock);

      const request = new NextRequest(
        'http://localhost:3000/api/wallet/balance?userId=user-123'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.wallet.id).toBe('wallet-123');
      expect(data.wallet.balance).toBe(50000);
      expect(data.wallet.hasVirtualCard).toBe(true);
      expect(data.wallet.cardLastFour).toBe('1234');
      expect(data.transactions).toHaveLength(2);
      expect(data.transactions[0].type).toBe('topup');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = new NextRequest(
        'http://localhost:3000/api/wallet/balance?userId=user-123'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle transactions being null', async () => {
      const fromMock = vi.fn();

      // Wallet found
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'wallet-123', balance: 10000 },
              error: null,
            }),
          }),
        }),
      });

      // Transactions query returns null
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      vi.mocked(supabaseAdmin.from).mockImplementation(fromMock);

      const request = new NextRequest(
        'http://localhost:3000/api/wallet/balance?userId=user-123'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transactions).toEqual([]);
    });
  });
});
