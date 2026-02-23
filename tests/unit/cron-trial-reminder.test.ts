// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── 환경변수 (vi.mock 팩토리보다 먼저 실행) ──
vi.hoisted(() => {
  process.env.CRON_SECRET = 'test-secret';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
});

// ── Supabase admin mock ──
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// ── 이메일 전송 mock ──
const mockSendTrialExpiringEmail = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/lib/email', () => ({
  sendTrialExpiringEmail: mockSendTrialExpiringEmail,
}));

vi.mock('@/lib/logger', () => ({
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { GET } from '@/app/api/cron/trial-reminder/route';

// ── 헬퍼 ──
function makeReq(authHeader?: string) {
  const headers: Record<string, string> = {};
  if (authHeader) headers['Authorization'] = authHeader;
  return new NextRequest('http://localhost/api/cron/trial-reminder', {
    method: 'GET',
    headers,
  });
}

// profiles 쿼리 체인 mock (select → eq → not → gte → lte)
function mockProfilesQuery(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue(result),
          }),
        }),
      }),
    }),
  };
}

describe('GET /api/cron/trial-reminder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
  });

  // ── CRON_SECRET 미설정 → 503 ──
  it('CRON_SECRET 미설정 → 503 반환', async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(makeReq());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('Cron not configured');
  });

  // ── 잘못된 Authorization → 401 ──
  it('잘못된 Bearer 토큰 → 401 반환', async () => {
    const res = await GET(makeReq('Bearer wrong-secret'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── Authorization 헤더 없음 → 401 ──
  it('Authorization 헤더 없음 → 401 반환', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  // ── 리마인드 대상 없음 → sent: 0 ──
  it('리마인드 대상 없음 → sent: 0 반환', async () => {
    mockFrom.mockReturnValue(
      mockProfilesQuery({ data: [], error: null }),
    );

    const res = await GET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sent).toBe(0);
    expect(body.message).toContain('대상 없음');
  });

  // ── DB 조회 오류 → 500 ──
  it('DB 조회 오류 → 500 반환', async () => {
    mockFrom.mockReturnValue(
      mockProfilesQuery({ data: null, error: { message: 'DB query failed' } }),
    );

    const res = await GET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Trial reminder query failed');
  });

  // ── 정상 처리: 리마인드 이메일 발송 ──
  it('만료 임박 유저 → 리마인드 이메일 발송 성공', async () => {
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const trials = [
      {
        id: 'user-1',
        email: 'user1@test.com',
        plan: 'pro',
        trial_ends_at: threeDaysLater.toISOString(),
        trial_converted: false,
      },
      {
        id: 'user-2',
        email: 'user2@test.com',
        plan: 'team',
        trial_ends_at: threeDaysLater.toISOString(),
        trial_converted: false,
      },
    ];

    mockFrom.mockReturnValue(
      mockProfilesQuery({ data: trials, error: null }),
    );

    const res = await GET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sent).toBe(2);
    expect(body.total).toBe(2);
    expect(body.message).toContain('2명');

    // 이메일 전송 함수가 각 유저에 대해 호출되었는지 확인
    expect(mockSendTrialExpiringEmail).toHaveBeenCalledTimes(2);
    expect(mockSendTrialExpiringEmail).toHaveBeenCalledWith(
      'user1@test.com',
      expect.any(Number),
      'pro',
    );
    expect(mockSendTrialExpiringEmail).toHaveBeenCalledWith(
      'user2@test.com',
      expect.any(Number),
      'team',
    );
  });

  // ── 이메일 전송 실패 → 실패한 건 건너뛰고 계속 진행 ──
  it('일부 이메일 전송 실패 → 성공 건수만 반환', async () => {
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const trials = [
      {
        id: 'user-1',
        email: 'user1@test.com',
        plan: 'pro',
        trial_ends_at: threeDaysLater.toISOString(),
        trial_converted: false,
      },
      {
        id: 'user-2',
        email: 'user2@test.com',
        plan: 'pro',
        trial_ends_at: threeDaysLater.toISOString(),
        trial_converted: false,
      },
    ];

    mockFrom.mockReturnValue(
      mockProfilesQuery({ data: trials, error: null }),
    );

    // 첫 번째 이메일 성공, 두 번째 실패
    mockSendTrialExpiringEmail
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('SMTP error'));

    const res = await GET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    // 성공 1건만 카운트
    expect(body.sent).toBe(1);
    expect(body.total).toBe(2);
  });

  // ── email 없는 유저 → 건너뜀 ──
  it('email 없는 유저는 건너뛰고 처리', async () => {
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const trials = [
      {
        id: 'user-no-email',
        email: null,
        plan: 'pro',
        trial_ends_at: threeDaysLater.toISOString(),
        trial_converted: false,
      },
      {
        id: 'user-with-email',
        email: 'valid@test.com',
        plan: 'pro',
        trial_ends_at: threeDaysLater.toISOString(),
        trial_converted: false,
      },
    ];

    mockFrom.mockReturnValue(
      mockProfilesQuery({ data: trials, error: null }),
    );

    const res = await GET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    // email 없는 유저는 건너뛰어 1건만 전송
    expect(body.sent).toBe(1);
    expect(body.total).toBe(2);
    expect(mockSendTrialExpiringEmail).toHaveBeenCalledTimes(1);
    expect(mockSendTrialExpiringEmail).toHaveBeenCalledWith(
      'valid@test.com',
      expect.any(Number),
      'pro',
    );
  });
});
