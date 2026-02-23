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

// Mock next/headers cookies()
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn().mockReturnValue([]) }),
}));

const mockAdminFrom = vi.fn();

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}));

import { GET, POST } from '@/app/api/cowork/docs/route';

function makeGetReq(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/cowork/docs');
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url, { method: 'GET' });
}

function makePostReq(body: unknown) {
  return new NextRequest('http://localhost/api/cowork/docs', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makePostReqInvalidJson() {
  return new NextRequest('http://localhost/api/cowork/docs', {
    method: 'POST',
    body: 'not-json{{{',
    headers: { 'Content-Type': 'application/json' },
  });
}

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }

const DOCS = [
  { id: 'd1', title: 'Doc 1', emoji: '📄', is_shared: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'd2', title: 'Doc 2', emoji: '📝', is_shared: true, created_at: '2024-01-02', updated_at: '2024-01-02' },
];

describe('GET /api/cowork/docs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeGetReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('유저 문서 목록 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    mockAdminFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [DOCS[0]], error: null }),
          }),
        }),
      }),
    });

    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.docs).toHaveLength(1);
    expect(body.docs[0].title).toBe('Doc 1');
  });

  it('shared=1 → 공유 문서 목록 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    mockAdminFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [DOCS[1]], error: null }),
          }),
        }),
      }),
    });

    const res = await GET(makeGetReq({ shared: '1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.docs).toHaveLength(1);
    expect(body.docs[0].is_shared).toBe(true);
  });

  it('빈 문서 목록 → 빈 배열 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    mockAdminFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.docs).toEqual([]);
  });

  it('DB 오류 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    mockAdminFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      }),
    });

    const res = await GET(makeGetReq());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('DB error');
  });
});

describe('POST /api/cowork/docs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makePostReq({ title: 'New Doc' }));
    expect(res.status).toBe(401);
  });

  it('새 문서 생성 → 201 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const newDoc = { id: 'd3', title: 'New Doc', emoji: '📄', is_shared: false, created_at: '2024-01-03', updated_at: '2024-01-03' };
    mockAdminFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: newDoc, error: null }),
        }),
      }),
    });

    const res = await POST(makePostReq({ title: 'New Doc' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.doc.title).toBe('New Doc');
  });

  it('기본값 적용 (title: "새 문서", emoji: "📄")', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const defaultDoc = { id: 'd4', title: '새 문서', emoji: '📄', is_shared: false, created_at: '2024-01-04', updated_at: '2024-01-04' };
    mockAdminFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: defaultDoc, error: null }),
        }),
      }),
    });

    const res = await POST(makePostReq({}));
    expect(res.status).toBe(201);
  });

  it('잘못된 JSON body → 기본값으로 처리 (빈 객체)', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const defaultDoc = { id: 'd5', title: '새 문서', emoji: '📄', is_shared: false, created_at: '2024-01-04', updated_at: '2024-01-04' };
    mockAdminFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: defaultDoc, error: null }),
        }),
      }),
    });

    const res = await POST(makePostReqInvalidJson());
    // The route catches JSON parse errors and uses {} as fallback
    expect(res.status).toBe(201);
  });

  it('title 빈 문자열 → 400 validation 오류', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await POST(makePostReq({ title: '' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('title 200자 초과 → 400 validation 오류', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await POST(makePostReq({ title: 'A'.repeat(201) }));
    expect(res.status).toBe(400);
  });

  it('content 500KB 초과 → 400 validation 오류', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await POST(makePostReq({ title: 'Big Doc', content: 'X'.repeat(500_001) }));
    expect(res.status).toBe(400);
  });

  it('DB 삽입 오류 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    mockAdminFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
        }),
      }),
    });

    const res = await POST(makePostReq({ title: 'Fail Doc' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('insert failed');
  });

  it('is_shared 필드 포함 생성', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const sharedDoc = { id: 'd6', title: 'Shared Doc', emoji: '📄', is_shared: true, created_at: '2024-01-05', updated_at: '2024-01-05' };
    mockAdminFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: sharedDoc, error: null }),
        }),
      }),
    });

    const res = await POST(makePostReq({ title: 'Shared Doc', is_shared: true }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.doc.is_shared).toBe(true);
  });
});
