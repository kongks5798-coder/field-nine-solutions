// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── vi.hoisted: vi.mock 팩토리보다 먼저 실행됨 ──
const mockGetSession = vi.hoisted(() => vi.fn());
const mockAdminFrom  = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn().mockReturnValue([]) }),
}));

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}));

vi.mock('@/lib/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), api: vi.fn(), security: vi.fn(), billing: vi.fn(), auth: vi.fn() },
}));

vi.mock('@/lib/env', () => ({ validateEnv: vi.fn() }));

import { POST } from '@/app/api/payment/toss/cancel/route';

// ── 헬퍼 ────────────────────────────────────────────────────────────────────

function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}
const NO_SESSION = { data: { session: null } };

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/payment/toss/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const ACTIVE_SUB = {
  id: 'sub-1',
  toss_payment_key: 'pk_test_123',
  plan: 'pro',
  current_period_end: '2026-03-23T00:00:00.000Z',
};

/**
 * mockAdminFrom을 설정하는 헬퍼.
 * from("subscriptions") -> select/update 체인과
 * from("billing_events") -> insert 체인을 설정합니다.
 */
function setupAdminMock(opts: {
  subData?: typeof ACTIVE_SUB | null;
  subError?: unknown;
}) {
  const { subData = ACTIVE_SUB, subError = null } = opts;

  mockAdminFrom.mockImplementation((table: string) => {
    if (table === 'subscriptions') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: subData, error: subError }),
                  }),
                }),
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    }
    if (table === 'billing_events') {
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }
    return {};
  });
}

// ── 테스트 ──────────────────────────────────────────────────────────────────

describe('POST /api/payment/toss/cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(NO_SESSION);
    process.env.TOSSPAYMENTS_SECRET_KEY = 'test-toss-key';
  });

  it('비인증 요청 → 401 반환', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('활성 Toss 구독 없음 → 404 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-1'));
    setupAdminMock({ subData: null, subError: { code: 'PGRST116' } });

    const res = await POST(makeReq({}));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('활성');
  });

  it('TOSSPAYMENTS_SECRET_KEY 미설정 → 503 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-1'));
    setupAdminMock({ subData: ACTIVE_SUB });
    delete process.env.TOSSPAYMENTS_SECRET_KEY;

    const res = await POST(makeReq({}));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain('미설정');
  });

  it('TossPayments API 실패 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-1'));
    setupAdminMock({ subData: ACTIVE_SUB });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: '잔액 부족' }),
    } as unknown as Response);

    const res = await POST(makeReq({ cancelReason: '테스트 취소' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('취소 처리 중 오류가 발생했습니다.');
  });

  it('TossPayments API 실패 (JSON 파싱 실패) → 기본 에러 메시지 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-1'));
    setupAdminMock({ subData: ACTIVE_SUB });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error('not json')),
    } as unknown as Response);

    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('오류');
  });

  it('취소 성공 → 성공 응답 + fetch 호출 확인', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-1'));
    setupAdminMock({ subData: ACTIVE_SUB });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'CANCELED' }),
    } as unknown as Response);

    const res = await POST(makeReq({ cancelReason: '사용자 요청' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('취소');
    expect(body.periodEnd).toBe(ACTIVE_SUB.current_period_end);

    // TossPayments API가 올바른 URL + paymentKey로 호출됐는지 확인
    expect(global.fetch).toHaveBeenCalledWith(
      `https://api.tosspayments.com/v1/payments/${ACTIVE_SUB.toss_payment_key}/cancel`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('cancelReason이 200자 초과 → zod 검증 실패 (ZodError throw)', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-1'));
    setupAdminMock({ subData: ACTIVE_SUB });

    const longReason = 'x'.repeat(201);
    // CancelSchema.parse()는 try/catch 없이 호출되므로 ZodError가 직접 throw됨
    await expect(POST(makeReq({ cancelReason: longReason }))).rejects.toThrow();
  });

  it('cancelReason 없으면 기본값 "사용자 요청" 사용', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-1'));
    setupAdminMock({ subData: ACTIVE_SUB });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as unknown as Response);

    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);

    // fetch body에 cancelReason: "사용자 요청"이 포함됐는지 확인
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const sentBody = JSON.parse(fetchCall[1].body);
    expect(sentBody.cancelReason).toBe('사용자 요청');
  });
});
