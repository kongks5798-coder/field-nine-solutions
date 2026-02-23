// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');

vi.mock('@/core/adminAuth', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/utils/supabase/admin', () => ({
  admin: { from: mocks.mockFrom },
}));

import { GET } from '@/app/api/admin/ai-hub/route';

// ── 인증 결과 상수 ──────────────────────────────────────────────────────────
const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
};

function makeReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/ai-hub');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

// ── 체인 모킹 헬퍼 ─────────────────────────────────────────────────────────
/** ai_tool_usage: select → gte → order → limit */
function mockUsageQuery(data: unknown[] | null) {
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

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('GET /api/admin/ai-hub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
  });

  it('인증 실패 시 403 반환', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await GET(makeReq());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  it('기본 range=7d 동작', async () => {
    const logs = [
      { tool_name: 'chatgpt', department: 'eng', tokens_used: 100, cost_usd: 0.005, request_type: 'chat', created_at: '2024-01-15T10:00:00Z' },
    ];
    mocks.mockFrom.mockReturnValue(mockUsageQuery(logs));

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.range).toBe('7d');
    expect(body.summary.totalRequests).toBe(1);
  });

  it('range=24h 동작', async () => {
    mocks.mockFrom.mockReturnValue(mockUsageQuery([]));

    const res = await GET(makeReq({ range: '24h' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.range).toBe('24h');
  });

  it('range=30d 동작', async () => {
    mocks.mockFrom.mockReturnValue(mockUsageQuery([]));

    const res = await GET(makeReq({ range: '30d' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.range).toBe('30d');
  });

  it('byTool 집계 정확성', async () => {
    const logs = [
      { tool_name: 'chatgpt', department: 'eng', tokens_used: 100, cost_usd: 0.005, request_type: 'chat', created_at: '2024-01-15T10:00:00Z' },
      { tool_name: 'chatgpt', department: 'design', tokens_used: 200, cost_usd: 0.01, request_type: 'completion', created_at: '2024-01-15T09:00:00Z' },
      { tool_name: 'claude', department: 'eng', tokens_used: 150, cost_usd: 0.008, request_type: 'chat', created_at: '2024-01-15T08:00:00Z' },
    ];
    mocks.mockFrom.mockReturnValue(mockUsageQuery(logs));

    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.byTool).toHaveLength(2);
    const chatgpt = body.byTool.find((t: { tool: string }) => t.tool === 'chatgpt');
    const claude = body.byTool.find((t: { tool: string }) => t.tool === 'claude');

    expect(chatgpt.count).toBe(2);
    expect(chatgpt.tokens).toBe(300);
    expect(claude.count).toBe(1);
    expect(claude.tokens).toBe(150);
  });

  it('byDepartment 집계 정확성', async () => {
    const logs = [
      { tool_name: 'chatgpt', department: 'eng', tokens_used: 100, cost_usd: 0.005, request_type: 'chat', created_at: '2024-01-15T10:00:00Z' },
      { tool_name: 'claude', department: 'eng', tokens_used: 200, cost_usd: 0.01, request_type: 'chat', created_at: '2024-01-15T09:00:00Z' },
      { tool_name: 'chatgpt', department: 'design', tokens_used: 50, cost_usd: 0.002, request_type: 'completion', created_at: '2024-01-15T08:00:00Z' },
    ];
    mocks.mockFrom.mockReturnValue(mockUsageQuery(logs));

    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.byDepartment).toHaveLength(2);
    const eng = body.byDepartment.find((d: { department: string }) => d.department === 'eng');
    const design = body.byDepartment.find((d: { department: string }) => d.department === 'design');

    expect(eng.count).toBe(2);
    expect(eng.tokens).toBe(300);
    expect(design.count).toBe(1);
    expect(design.tokens).toBe(50);
  });

  it('빈 데이터 처리', async () => {
    mocks.mockFrom.mockReturnValue(mockUsageQuery(null));

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.summary.totalRequests).toBe(0);
    expect(body.summary.totalTokens).toBe(0);
    expect(body.summary.totalCost).toBe(0);
    expect(body.byTool).toEqual([]);
    expect(body.byDepartment).toEqual([]);
  });

  it('cost 소수점 4자리 반올림', async () => {
    const logs = [
      { tool_name: 'chatgpt', department: 'eng', tokens_used: 100, cost_usd: 0.00123456, request_type: 'chat', created_at: '2024-01-15T10:00:00Z' },
      { tool_name: 'chatgpt', department: 'eng', tokens_used: 200, cost_usd: 0.00876544, request_type: 'chat', created_at: '2024-01-15T09:00:00Z' },
    ];
    mocks.mockFrom.mockReturnValue(mockUsageQuery(logs));

    const res = await GET(makeReq());
    const body = await res.json();

    // 0.00123456 + 0.00876544 = 0.01
    expect(body.summary.totalCost).toBe(0.01);
    const chatgpt = body.byTool.find((t: { tool: string }) => t.tool === 'chatgpt');
    expect(chatgpt.cost).toBe(0.01);
  });
});
