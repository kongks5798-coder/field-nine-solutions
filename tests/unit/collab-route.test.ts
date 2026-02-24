// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), api: vi.fn(), security: vi.fn(), billing: vi.fn(), auth: vi.fn() },
}));

const mockGetSession = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}));

const mockFrom = vi.fn();

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { GET, POST } from '@/app/api/collab/route';

function makeGetReq(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/collab');
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url, { method: 'GET' });
}

function makePostReq(body: unknown) {
  return new NextRequest('http://localhost/api/collab', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makePostReqInvalidJson() {
  return new NextRequest('http://localhost/api/collab', {
    method: 'POST',
    body: 'not-json{{{',
    headers: { 'Content-Type': 'application/json' },
  });
}

const SESSIONS = [
  { id: '1', slug: 'doc-a', title: 'Doc A', content: 'Hello', owner_id: 'u1', updated_at: '2024-01-01' },
  { id: '2', slug: 'doc-b', title: 'Doc B', content: 'World', owner_id: 'u2', updated_at: '2024-01-02' },
];

describe('GET /api/collab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
  });

  it('활성 세션 목록 반환', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: SESSIONS, error: null }),
        }),
      }),
    });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessions).toHaveLength(2);
    expect(body.sessions[0].slug).toBe('doc-a');
  });

  it('limit 파라미터 적용 (최대 100)', async () => {
    const limitFn = vi.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: limitFn,
        }),
      }),
    });
    const res = await GET(makeGetReq({ limit: '200' }));
    expect(res.status).toBe(200);
    // limit should be capped at 100 internally
    expect(limitFn).toHaveBeenCalledWith(100);
  });

  it('빈 세션 목록 → 빈 배열 반환', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessions).toEqual([]);
  });

  it('DB 오류 → 500 반환', async () => {
    const dbError = new Error('DB error');
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: dbError }),
        }),
      }),
    });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('세션 목록 조회 중 오류가 발생했습니다.');
  });
});

describe('POST /api/collab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
  });

  it('잘못된 JSON → 400 반환', async () => {
    const res = await POST(makePostReqInvalidJson());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid JSON');
  });

  it('slug 없음 → 400 반환', async () => {
    const res = await POST(makePostReq({ title: 'Test' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('slug is required');
  });

  it('기존 세션 존재 → join (created: false)', async () => {
    const existing = { id: '1', slug: 'doc-a', title: 'Doc A', content: 'Hello', owner_id: 'u1', updated_at: '2024-01-01' };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: existing, error: null }),
        }),
      }),
    });

    const res = await POST(makePostReq({ slug: 'doc-a' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(false);
    expect(body.session.slug).toBe('doc-a');
  });

  it('새 세션 생성 → 201 + created: true', async () => {
    const newSession = { id: '3', slug: 'new-doc', title: 'New Doc', content: '', owner_id: null, updated_at: '2024-01-03' };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: select existing → not found
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      // Second call: insert new session
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
          }),
        }),
      };
    });

    const res = await POST(makePostReq({ slug: 'new-doc', title: 'New Doc' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
    expect(body.session.slug).toBe('new-doc');
  });

  it('owner_id 포함 생성', async () => {
    const newSession = { id: '4', slug: 'owned-doc', title: 'Untitled', content: '', owner_id: 'u1', updated_at: '2024-01-04' };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
          }),
        }),
      };
    });

    const res = await POST(makePostReq({ slug: 'owned-doc', owner_id: 'u1' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.session.owner_id).toBe('u1');
  });

  it('DB 삽입 오류 → 500 반환', async () => {
    let callCount = 0;
    const dbError = new Error('insert failed');
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
          }),
        }),
      };
    });

    const res = await POST(makePostReq({ slug: 'fail-doc' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('세션 생성 중 오류가 발생했습니다.');
  });
});
