// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createHmac } from 'crypto';

// ── vi.hoisted: vi.mock 팩토리보다 먼저 실행됨 ──
const mockLogBilling  = vi.hoisted(() => vi.fn());
const mockLogSecurity = vi.hoisted(() => vi.fn());
const mockLogError    = vi.hoisted(() => vi.fn());
const mockLogWarn     = vi.hoisted(() => vi.fn());

vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: mockLogWarn,
    error: mockLogError,
    api: vi.fn(),
    security: mockLogSecurity,
    billing: mockLogBilling,
    auth: vi.fn(),
  },
}));

vi.mock('@/lib/env', () => ({ validateEnv: vi.fn() }));

// ── 헬퍼 ────────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = 'test-webhook-secret-key-12345';

/**
 * HMAC-SHA256 서명을 생성합니다 (TossPayments 서명 방식과 동일).
 */
function createSignature(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64');
}

function makeWebhookReq(body: string, signature?: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (signature !== null && signature !== undefined) {
    headers['toss-signature'] = signature;
  }
  return new NextRequest('http://localhost/api/payment/toss/webhook', {
    method: 'POST',
    headers,
    body,
  });
}

function makeSignedReq(payload: unknown) {
  const body = JSON.stringify(payload);
  const signature = createSignature(body, WEBHOOK_SECRET);
  return makeWebhookReq(body, signature);
}

// ── 테스트 ──────────────────────────────────────────────────────────────────

describe('POST /api/payment/toss/webhook (v2 with signature)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // TOSSPAYMENTS_WEBHOOK_SECRET은 모듈 로딩 시 상수로 캡처됨.
    // vi.mock에서 직접 접근하지 않으므로 resetModules로 처리해야 합니다.
    // 대신 각 테스트에서 모듈을 dynamic import로 가져옵니다.
  });

  describe('서명 미설정 (TOSSPAYMENTS_WEBHOOK_SECRET 없음)', () => {
    it('웹훅 시크릿 미설정 → 401 반환', async () => {
      // 환경변수 없이 모듈 로드
      const originalSecret = process.env.TOSSPAYMENTS_WEBHOOK_SECRET;
      delete process.env.TOSSPAYMENTS_WEBHOOK_SECRET;

      // 모듈 캐시를 클리어해서 TOSS_WEBHOOK_SECRET = "" 으로 다시 평가
      vi.resetModules();

      // 의존하는 모듈 다시 mock
      vi.doMock('@/lib/logger', () => ({
        log: {
          debug: vi.fn(), info: vi.fn(), warn: vi.fn(),
          error: mockLogError, api: vi.fn(),
          security: mockLogSecurity, billing: mockLogBilling, auth: vi.fn(),
        },
      }));

      const { POST } = await import('@/app/api/payment/toss/webhook/route');

      const body = JSON.stringify({ eventType: 'PAYMENT_STATUS_CHANGED', data: {} });
      const req = makeWebhookReq(body, 'any-sig');
      const res = await POST(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Webhook not configured');

      // 환경변수 복원
      if (originalSecret !== undefined) {
        process.env.TOSSPAYMENTS_WEBHOOK_SECRET = originalSecret;
      }
    });
  });

  describe('서명 검증', () => {
    // 이 그룹의 테스트들은 TOSSPAYMENTS_WEBHOOK_SECRET이 설정된 상태에서 실행
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
      vi.resetModules();
      process.env.TOSSPAYMENTS_WEBHOOK_SECRET = WEBHOOK_SECRET;

      vi.doMock('@/lib/logger', () => ({
        log: {
          debug: vi.fn(), info: vi.fn(), warn: mockLogWarn,
          error: mockLogError, api: vi.fn(),
          security: mockLogSecurity, billing: mockLogBilling, auth: vi.fn(),
        },
      }));

      const mod = await import('@/app/api/payment/toss/webhook/route');
      POST = mod.POST;
    });

    it('toss-signature 헤더 없음 → 401 반환', async () => {
      const body = JSON.stringify({ eventType: 'PAYMENT_STATUS_CHANGED', data: {} });
      const req = makeWebhookReq(body, null); // 서명 헤더 없음
      const res = await POST(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Invalid signature');
    });

    it('잘못된 서명 → 401 반환', async () => {
      const body = JSON.stringify({ eventType: 'PAYMENT_STATUS_CHANGED', data: {} });
      const req = makeWebhookReq(body, 'invalid-signature-base64');
      const res = await POST(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Invalid signature');
    });

    it('유효한 PAYMENT_STATUS_CHANGED (DONE) → 200 반환', async () => {
      const payload = {
        eventType: 'PAYMENT_STATUS_CHANGED',
        data: {
          paymentKey: 'pk_test_123',
          orderId: 'order-1',
          status: 'DONE',
        },
      };
      const req = makeSignedReq(payload);
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
    });

    it('유효한 PAYMENT_STATUS_CHANGED (CANCELED) → 200 반환', async () => {
      const payload = {
        eventType: 'PAYMENT_STATUS_CHANGED',
        data: {
          paymentKey: 'pk_test_456',
          orderId: 'order-2',
          status: 'CANCELED',
        },
      };
      const req = makeSignedReq(payload);
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
    });

    it('유효한 PAYMENT_STATUS_CHANGED (EXPIRED) → 200 반환', async () => {
      const payload = {
        eventType: 'PAYMENT_STATUS_CHANGED',
        data: {
          paymentKey: 'pk_test_789',
          orderId: 'order-3',
          status: 'EXPIRED',
        },
      };
      const req = makeSignedReq(payload);
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
    });

    it('유효한 PAYOUT_STATUS_CHANGED → 200 반환', async () => {
      const payload = {
        eventType: 'PAYOUT_STATUS_CHANGED',
        data: {
          payoutId: 'payout-1',
          status: 'COMPLETED',
        },
      };
      const req = makeSignedReq(payload);
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
    });

    it('알 수 없는 이벤트 타입 → 200 반환 (무시)', async () => {
      const payload = {
        eventType: 'UNKNOWN_EVENT_TYPE',
        data: { foo: 'bar' },
      };
      const req = makeSignedReq(payload);
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
    });

    it('잘못된 JSON 바디 → 400 반환', async () => {
      const invalidJson = '{ broken json !!!';
      const signature = createSignature(invalidJson, WEBHOOK_SECRET);
      const req = makeWebhookReq(invalidJson, signature);
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });

    it('서명이 다른 시크릿 키로 생성된 경우 → 401 반환', async () => {
      const payload = { eventType: 'PAYMENT_STATUS_CHANGED', data: { paymentKey: 'pk_1' } };
      const body = JSON.stringify(payload);
      const wrongSignature = createSignature(body, 'wrong-secret-key');
      const req = makeWebhookReq(body, wrongSignature);
      const res = await POST(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Invalid signature');
    });

    it('PAYMENT_STATUS_CHANGED (PARTIAL_CANCELED) → 200 반환', async () => {
      const payload = {
        eventType: 'PAYMENT_STATUS_CHANGED',
        data: {
          paymentKey: 'pk_test_partial',
          orderId: 'order-partial',
          status: 'PARTIAL_CANCELED',
        },
      };
      const req = makeSignedReq(payload);
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
    });
  });
});
