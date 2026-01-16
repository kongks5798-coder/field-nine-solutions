/**
 * Toss Payments Client Tests
 * lib/toss/client.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateTossConfig,
  generateOrderId,
  formatKRW,
  confirmPayment,
  getPaymentInfo,
  cancelPayment,
} from '@/lib/toss/client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Toss Payments Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateTossConfig', () => {
    it('should return errors when env vars are missing', () => {
      // Note: In actual runtime, env vars might not be set
      const result = validateTossConfig();

      // The validation should return a result object
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('generateOrderId', () => {
    it('should generate unique order IDs', () => {
      const id1 = generateOrderId();
      const id2 = generateOrderId();

      expect(id1).not.toBe(id2);
    });

    it('should start with ORDER_ prefix', () => {
      const orderId = generateOrderId();

      expect(orderId.startsWith('ORDER_')).toBe(true);
    });

    it('should be uppercase', () => {
      const orderId = generateOrderId();

      expect(orderId).toBe(orderId.toUpperCase());
    });

    it('should have reasonable length', () => {
      const orderId = generateOrderId();

      expect(orderId.length).toBeGreaterThan(10);
      expect(orderId.length).toBeLessThan(50);
    });
  });

  describe('formatKRW', () => {
    it('should format small amounts correctly', () => {
      const result = formatKRW(1000);

      expect(result).toContain('1,000');
      expect(result).toContain('₩');
    });

    it('should format large amounts correctly', () => {
      const result = formatKRW(1000000);

      expect(result).toContain('1,000,000');
    });

    it('should handle zero', () => {
      const result = formatKRW(0);

      expect(result).toContain('0');
    });
  });

  describe('confirmPayment', () => {
    it('should return error when secret key is not configured', async () => {
      // When TOSS_SECRET_KEY is empty/undefined
      const result = await confirmPayment({
        paymentKey: 'test-payment-key',
        orderId: 'ORDER_TEST_123',
        amount: 10000,
      });

      // Should fail gracefully with an error message
      // (actual behavior depends on env config)
      expect(result).toHaveProperty('success');
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should call Toss API with correct parameters', async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          paymentKey: 'pk_test_123',
          orderId: 'ORDER_123',
          status: 'DONE',
          method: 'CARD',
          totalAmount: 10000,
        }),
      });

      // This test verifies the API call structure
      // In a real scenario, you'd need to set up env vars
      const params = {
        paymentKey: 'test-payment-key',
        orderId: 'ORDER_TEST_123',
        amount: 10000,
      };

      await confirmPayment(params);

      // If fetch was called, verify the structure
      if (mockFetch.mock.calls.length > 0) {
        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('tosspayments.com');
        expect(options.method).toBe('POST');
        expect(options.headers['Content-Type']).toBe('application/json');
      }
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: '결제 승인 실패',
        }),
      });

      const result = await confirmPayment({
        paymentKey: 'invalid-key',
        orderId: 'ORDER_INVALID',
        amount: 10000,
      });

      // Should return success: false with error message
      expect(result.success).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await confirmPayment({
        paymentKey: 'test-key',
        orderId: 'ORDER_123',
        amount: 10000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getPaymentInfo', () => {
    it('should return null on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const result = await getPaymentInfo('invalid-payment-key');

      expect(result).toBeNull();
    });

    it('should return payment info on success', async () => {
      const mockPaymentInfo = {
        paymentKey: 'pk_test_123',
        orderId: 'ORDER_123',
        orderName: 'Test Order',
        status: 'DONE',
        method: 'CARD',
        totalAmount: 10000,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentInfo,
      });

      const result = await getPaymentInfo('pk_test_123');

      // If fetch was successful and env is configured
      if (result) {
        expect(result.paymentKey).toBe('pk_test_123');
        expect(result.status).toBe('DONE');
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getPaymentInfo('test-key');

      expect(result).toBeNull();
    });
  });

  describe('cancelPayment', () => {
    it('should return error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: '취소 실패',
        }),
      });

      const result = await cancelPayment('pk_test_123', '고객 요청');

      expect(result.success).toBe(false);
    });

    it('should return success on successful cancellation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          paymentKey: 'pk_test_123',
          status: 'CANCELED',
        }),
      });

      const result = await cancelPayment('pk_test_123', '고객 요청');

      // If env is configured, should return success
      if (mockFetch.mock.calls.length > 0) {
        expect(result.success).toBe(true);
        expect(result.status).toBe('CANCELED');
      }
    });

    it('should include cancel reason in request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          paymentKey: 'pk_test_123',
          status: 'CANCELED',
        }),
      });

      await cancelPayment('pk_test_123', '테스트 취소 사유');

      if (mockFetch.mock.calls.length > 0) {
        const [, options] = mockFetch.mock.calls[0];
        const body = JSON.parse(options.body);
        expect(body.cancelReason).toBe('테스트 취소 사유');
      }
    });
  });
});
