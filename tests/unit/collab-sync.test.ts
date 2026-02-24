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

import { GET, POST } from '@/app/api/collab/sync/route';

function makeGetReq(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/collab/sync');
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url, { method: 'GET' });
}

function makePostReq(body: unknown) {
  return new NextRequest('http://localhost/api/collab/sync', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makePostReqInvalidJson() {
  return new NextRequest('http://localhost/api/collab/sync', {
    method: 'POST',
    body: 'not-json{{{',
    headers: { 'Content-Type': 'application/json' },
  });
}

const DOC = { id: '1', slug: 'my-doc', title: 'My Doc', content: 'Hello World', updated_at: '2024-01-01' };

describe('GET /api/collab/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
  });

  it('slug 파라미터 없음 → 400 반환', async () => {
    const res = await GET(makeGetReq());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('slug required');
  });

  it('slug로 문서 조회 성공', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: DOC, error: null }),
        }),
      }),
    });

    const res = await GET(makeGetReq({ slug: 'my-doc' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.doc.slug).toBe('my-doc');
    expect(body.doc.content).toBe('Hello World');
  });

  it('문서 없음 → doc: null 반환', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const res = await GET(makeGetReq({ slug: 'nonexistent' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.doc).toBeNull();
  });

  it('DB 오류 → 500 반환', async () => {
    const dbError = new Error('query failed');
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: dbError }),
        }),
      }),
    });

    const res = await GET(makeGetReq({ slug: 'error-doc' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('문서 조회 중 오류가 발생했습니다.');
  });
});

describe('POST /api/collab/sync', () => {
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
    const res = await POST(makePostReq({ title: 'Test', content: 'Hello' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('slug required');
  });

  it('문서 upsert 성공', async () => {
    const upsertedDoc = { id: '1', slug: 'my-doc', title: 'Updated', content: 'New content', updated_at: '2024-01-02' };
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: upsertedDoc, error: null }),
        }),
      }),
    });

    const res = await POST(makePostReq({ slug: 'my-doc', title: 'Updated', content: 'New content' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.doc.slug).toBe('my-doc');
    expect(body.doc.content).toBe('New content');
  });

  it('기본값 적용 (title: Untitled, content: "")', async () => {
    const upsertedDoc = { id: '2', slug: 'bare-doc', title: 'Untitled', content: '', updated_at: '2024-01-03' };
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: upsertedDoc, error: null }),
        }),
      }),
    });

    const res = await POST(makePostReq({ slug: 'bare-doc' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.doc.title).toBe('Untitled');
  });

  it('DB upsert 오류 → 500 반환', async () => {
    const dbError = new Error('upsert failed');
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
        }),
      }),
    });

    const res = await POST(makePostReq({ slug: 'fail-doc', content: 'test' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('문서 저장 중 오류가 발생했습니다.');
  });
});
