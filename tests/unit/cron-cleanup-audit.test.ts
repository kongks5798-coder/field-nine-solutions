import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), api: vi.fn(), security: vi.fn(), billing: vi.fn(), auth: vi.fn() },
}));

const mockDelete = vi.fn();
const mockLt = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { GET } from '@/app/api/cron/cleanup-audit/route';

function makeReq(authHeader?: string) {
  const headers: Record<string, string> = {};
  if (authHeader) headers['Authorization'] = authHeader;
  return new NextRequest('http://localhost/api/cron/cleanup-audit', { method: 'GET', headers });
}

describe('GET /api/cron/cleanup-audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock chain
    mockLt.mockResolvedValue({ count: 5, error: null });
    mockDelete.mockReturnValue({ lt: mockLt });
    mockFrom.mockReturnValue({ delete: mockDelete });
    // Set CRON_SECRET env
    process.env.CRON_SECRET = 'test-secret';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('Authorization 헤더 없음 → 401 반환', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('잘못된 Authorization 헤더 → 401 반환', async () => {
    const res = await GET(makeReq('Bearer wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('올바른 Authorization → 200 + 삭제 카운트 반환', async () => {
    const res = await GET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.deleted).toBe(5);
    expect(body.cutoff).toBeDefined();
  });

  it('DB 오류 → 500 반환', async () => {
    mockLt.mockResolvedValue({ count: null, error: { message: 'DB error' } });
    const res = await GET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(500);
  });

  it('90일 기준 cutoff 날짜가 과거임', async () => {
    const res = await GET(makeReq('Bearer test-secret'));
    const body = await res.json();
    const cutoff = new Date(body.cutoff);
    const now = new Date();
    const diffMs = now.getTime() - cutoff.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(89);
    expect(diffDays).toBeLessThan(91);
  });
});
