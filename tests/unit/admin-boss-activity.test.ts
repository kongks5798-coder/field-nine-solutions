// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/core/adminAuth', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({ from: mocks.mockFrom })),
}));

import { GET } from '@/app/api/admin/boss/activity/route';

// ── 인증 결과 상수 ──────────────────────────────────────────────────────────
const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
};

function makeReq(path = '/api/admin/boss/activity') {
  return new NextRequest(`http://localhost${path}`);
}

// ── 체인 모킹 헬퍼 ─────────────────────────────────────────────────────────
/** employee_activity: select → gte → order → limit */
function mockActivityQuery(data: unknown[] | null) {
  return {
    select: vi.fn().mockReturnValue({
      gte: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data }),
        }),
      }),
    }),
  };
}

/** employee_activity feed: select → order → limit */
function mockFeedQuery(data: unknown[] | null) {
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data }),
      }),
    }),
  };
}

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('GET /api/admin/boss/activity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('인증 실패 시 403 반환', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await GET(makeReq());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  it('부서별 통계 정상 반환', async () => {
    const activities = [
      { department: 'engineering', action_type: 'build', user_id: 'u1', created_at: '2024-01-15T10:00:00Z', metadata: {} },
      { department: 'engineering', action_type: 'ai_query', user_id: 'u2', created_at: '2024-01-15T09:00:00Z', metadata: {} },
      { department: 'design', action_type: 'deploy', user_id: 'u3', created_at: '2024-01-15T08:00:00Z', metadata: {} },
    ];
    const feedItems = [
      { id: 'f1', department: 'engineering', action_type: 'build', user_id: 'u1', created_at: '2024-01-15T10:00:00Z' },
    ];

    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) return mockActivityQuery(activities);
      return mockFeedQuery(feedItems);
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.departments).toHaveLength(2);
    const eng = body.departments.find((d: { department: string }) => d.department === 'engineering');
    expect(eng).toBeDefined();
    expect(eng.activeMembers).toBe(2);
    expect(eng.builds).toBe(1);
    expect(eng.aiQueries).toBe(1);
  });

  it('KPI (totalUsers, totalBuilds, totalAiQueries) 정확 계산', async () => {
    const activities = [
      { department: 'eng', action_type: 'build', user_id: 'u1', created_at: '2024-01-15T10:00:00Z', metadata: {} },
      { department: 'eng', action_type: 'deploy', user_id: 'u1', created_at: '2024-01-15T09:00:00Z', metadata: {} },
      { department: 'eng', action_type: 'ai_query', user_id: 'u2', created_at: '2024-01-15T08:00:00Z', metadata: {} },
      { department: 'design', action_type: 'ai_query', user_id: 'u3', created_at: '2024-01-15T07:00:00Z', metadata: {} },
    ];

    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) return mockActivityQuery(activities);
      return mockFeedQuery([]);
    });

    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.kpi.totalUsers).toBe(3);       // u1, u2, u3
    expect(body.kpi.totalBuilds).toBe(2);       // build + deploy
    expect(body.kpi.totalAiQueries).toBe(2);    // 2 ai_query
  });

  it('피드 최근 20건 반환', async () => {
    const feedItems = Array.from({ length: 20 }, (_, i) => ({
      id: `f${i}`,
      department: 'eng',
      action_type: 'build',
      user_id: `u${i}`,
      created_at: `2024-01-15T${String(i).padStart(2, '0')}:00:00Z`,
    }));

    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) return mockActivityQuery([]);
      return mockFeedQuery(feedItems);
    });

    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.feed).toHaveLength(20);
    expect(body.feed[0].id).toBe('f0');
  });

  it('빈 데이터 시 기본값 반환', async () => {
    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) return mockActivityQuery(null);
      return mockFeedQuery(null);
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.kpi.totalUsers).toBe(0);
    expect(body.kpi.totalBuilds).toBe(0);
    expect(body.kpi.totalAiQueries).toBe(0);
    expect(body.kpi.totalTokens).toBe(0);
    expect(body.departments).toEqual([]);
    expect(body.feed).toEqual([]);
  });

  it('여러 부서 집계 정확성', async () => {
    const activities = [
      { department: 'eng', action_type: 'build', user_id: 'u1', created_at: '2024-01-15T10:00:00Z', metadata: {} },
      { department: 'eng', action_type: 'build', user_id: 'u2', created_at: '2024-01-15T09:00:00Z', metadata: {} },
      { department: 'design', action_type: 'ai_query', user_id: 'u3', created_at: '2024-01-15T08:00:00Z', metadata: {} },
      { department: 'design', action_type: 'ai_query', user_id: 'u4', created_at: '2024-01-15T07:00:00Z', metadata: {} },
      { department: 'marketing', action_type: 'deploy', user_id: 'u5', created_at: '2024-01-15T06:00:00Z', metadata: {} },
    ];

    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) return mockActivityQuery(activities);
      return mockFeedQuery([]);
    });

    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.departments).toHaveLength(3);
    const eng = body.departments.find((d: { department: string }) => d.department === 'eng');
    const design = body.departments.find((d: { department: string }) => d.department === 'design');
    const marketing = body.departments.find((d: { department: string }) => d.department === 'marketing');

    expect(eng.builds).toBe(2);
    expect(eng.aiQueries).toBe(0);
    expect(design.builds).toBe(0);
    expect(design.aiQueries).toBe(2);
    expect(marketing.builds).toBe(1); // deploy counts as build
    expect(marketing.activeMembers).toBe(1);
  });

  it('metadata.tokens 합산 검증', async () => {
    const activities = [
      { department: 'eng', action_type: 'ai_query', user_id: 'u1', created_at: '2024-01-15T10:00:00Z', metadata: { tokens: 150 } },
      { department: 'eng', action_type: 'ai_query', user_id: 'u2', created_at: '2024-01-15T09:00:00Z', metadata: { tokens: 250 } },
      { department: 'design', action_type: 'ai_query', user_id: 'u3', created_at: '2024-01-15T08:00:00Z', metadata: { tokens: 100 } },
    ];

    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) return mockActivityQuery(activities);
      return mockFeedQuery([]);
    });

    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.kpi.totalTokens).toBe(500); // 150 + 250 + 100
  });
});
