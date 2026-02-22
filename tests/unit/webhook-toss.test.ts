import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * TossPayments 웹훅 핸들러 테스트
 *
 * 현재 프로젝트에는 독립된 Toss 웹훅 라우트가 없으므로,
 * Toss 이벤트 처리 로직을 독립 함수로 추출하여 테스트합니다.
 * 이 패턴은 향후 /api/webhooks/toss 라우트 생성 시 그대로 사용할 수 있습니다.
 */

// ── Toss 웹훅 이벤트 처리 함수 (인라인 구현) ──

interface TossWebhookEvent {
  eventType: string;
  data: Record<string, unknown>;
}

interface WebhookResult {
  status: number;
  body: Record<string, unknown>;
}

// DB mock
const mockUpsert = vi.fn((_data?: unknown) => Promise.resolve({ error: null }));
const mockUpdate = vi.fn((_data?: unknown) => ({ eq: vi.fn((_k?: unknown) => Promise.resolve({ error: null })) }));
const mockInsert = vi.fn((_data?: unknown) => Promise.resolve({ error: null }));
const mockSelect = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: { user_id: 'uid-1', plan: 'pro', status: 'active' } }),
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { user_id: 'uid-1', plan: 'pro', status: 'active' } }),
    }),
  }),
});

function getAdminMock() {
  return {
    from: (_table: string) => ({
      upsert: mockUpsert,
      update: mockUpdate,
      insert: mockInsert,
      select: mockSelect,
    }),
  };
}

/**
 * Toss 웹훅 이벤트 처리기 (테스트용 구현)
 * 실제 라우트 생성 시 이 로직을 사용합니다.
 */
async function handleTossWebhook(
  event: TossWebhookEvent,
  secretKey: string | undefined
): Promise<WebhookResult> {
  if (!secretKey) {
    return { status: 503, body: { error: 'TossPayments not configured' } };
  }

  const { eventType, data } = event;

  if (!eventType || !data) {
    return { status: 400, body: { error: 'Invalid event payload' } };
  }

  const admin = getAdminMock();

  switch (eventType) {
    case 'PAYMENT_STATUS_CHANGED': {
      const paymentKey = data.paymentKey as string;
      const status = data.status as string;
      if (!paymentKey) return { status: 400, body: { error: 'Missing paymentKey' } };

      // 구독 상태 업데이트
      await admin.from('subscriptions').update({ status: status === 'DONE' ? 'active' : 'past_due' });

      // billing_events 기록
      await admin.from('billing_events').insert({
        type: 'toss_payment_status_changed',
        description: `결제 상태 변경: ${status}`,
      });

      return { status: 200, body: { received: true, eventType } };
    }

    case 'BILLING_KEY_STATUS_CHANGED': {
      const billingKey = data.billingKey as string;
      const status = data.status as string;
      if (!billingKey) return { status: 400, body: { error: 'Missing billingKey' } };

      await admin.from('subscriptions').update({
        toss_billing_status: status,
      });

      await admin.from('billing_events').insert({
        type: 'toss_billing_key_status_changed',
        description: `빌링키 상태: ${status}`,
      });

      return { status: 200, body: { received: true, eventType } };
    }

    case 'PAYMENT_CANCELED': {
      const paymentKey = data.paymentKey as string;
      if (!paymentKey) return { status: 400, body: { error: 'Missing paymentKey' } };

      await admin.from('subscriptions').update({ status: 'canceled' });
      await admin.from('billing_events').insert({
        type: 'toss_payment_canceled',
        description: '결제 취소',
      });

      return { status: 200, body: { received: true, eventType } };
    }

    default:
      return { status: 200, body: { received: true, skipped: true } };
  }
}

// ── 테스트 ──────────────────────────────────────────────────────────────────

describe('Toss Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('시크릿 키 미설정 → 503 반환', async () => {
    const result = await handleTossWebhook(
      { eventType: 'PAYMENT_STATUS_CHANGED', data: { paymentKey: 'pk_1' } },
      undefined
    );
    expect(result.status).toBe(503);
    expect(result.body.error).toBe('TossPayments not configured');
  });

  it('잘못된 이벤트 페이로드 → 400 반환', async () => {
    const result = await handleTossWebhook(
      { eventType: '', data: {} },
      'test-key'
    );
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Invalid event payload');
  });

  it('PAYMENT_STATUS_CHANGED — DONE → 구독 active 설정', async () => {
    const result = await handleTossWebhook(
      { eventType: 'PAYMENT_STATUS_CHANGED', data: { paymentKey: 'pk_1', status: 'DONE' } },
      'test-key'
    );
    expect(result.status).toBe(200);
    expect(result.body.received).toBe(true);
    expect(result.body.eventType).toBe('PAYMENT_STATUS_CHANGED');
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
  });

  it('PAYMENT_STATUS_CHANGED — paymentKey 없음 → 400', async () => {
    const result = await handleTossWebhook(
      { eventType: 'PAYMENT_STATUS_CHANGED', data: { status: 'DONE' } },
      'test-key'
    );
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Missing paymentKey');
  });

  it('BILLING_KEY_STATUS_CHANGED → 빌링키 상태 업데이트', async () => {
    const result = await handleTossWebhook(
      { eventType: 'BILLING_KEY_STATUS_CHANGED', data: { billingKey: 'bk_1', status: 'READY' } },
      'test-key'
    );
    expect(result.status).toBe(200);
    expect(result.body.received).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
  });

  it('BILLING_KEY_STATUS_CHANGED — billingKey 없음 → 400', async () => {
    const result = await handleTossWebhook(
      { eventType: 'BILLING_KEY_STATUS_CHANGED', data: { status: 'READY' } },
      'test-key'
    );
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Missing billingKey');
  });

  it('PAYMENT_CANCELED → 구독 canceled 설정', async () => {
    const result = await handleTossWebhook(
      { eventType: 'PAYMENT_CANCELED', data: { paymentKey: 'pk_2' } },
      'test-key'
    );
    expect(result.status).toBe(200);
    expect(result.body.received).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('알 수 없는 이벤트 타입 → 무시하고 received: true', async () => {
    const result = await handleTossWebhook(
      { eventType: 'UNKNOWN_EVENT', data: { foo: 'bar' } },
      'test-key'
    );
    expect(result.status).toBe(200);
    expect(result.body.received).toBe(true);
    expect(result.body.skipped).toBe(true);
  });
});
