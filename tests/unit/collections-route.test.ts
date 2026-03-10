import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockGetSession, mockFrom } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: mockFrom,
  })),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true, remaining: 4, limit: 10, resetAt: Date.now() + 60_000 }),
}));

import { GET, POST, DELETE } from '@/app/api/collections/route';
import { checkRateLimit } from '@/lib/rate-limit';

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function makeReq(method: string, body?: unknown, search?: string) {
  const url = `http://localhost/api/collections${search ?? ''}`;
  return new NextRequest(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('GET /api/collections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('인증됨 → 컬렉션 목록 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const mockData = [
      { id: 'c1', name: '내 컬렉션', description: null, is_public: true, created_at: '2024-01-01', collection_apps: [{ count: 3 }] },
    ];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      }),
    });

    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.collections).toHaveLength(1);
    expect(body.collections[0].app_count).toBe(3);
  });

  it('DB 에러 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
      }),
    });

    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/collections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockReturnValue({ success: true, remaining: 4, limit: 10, resetAt: Date.now() + 60_000 });
  });

  it('레이트 리밋 초과 → 429 반환', async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ success: false, remaining: 0, limit: 10, resetAt: Date.now() + 60_000 });
    const res = await POST(makeReq('POST', { name: '테스트' }));
    expect(res.status).toBe(429);
  });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makeReq('POST', { name: '테스트' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('name 누락 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makeReq('POST', {}));
    expect(res.status).toBe(400);
  });

  it('name 빈 문자열 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makeReq('POST', { name: '' }));
    expect(res.status).toBe(400);
  });

  it('정상 생성 → 201 + collection 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const newCollection = { id: 'c1', name: '새 컬렉션', description: null, is_public: true, created_at: '2024-01-01' };
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: newCollection, error: null }),
        }),
      }),
    });

    const res = await POST(makeReq('POST', { name: '새 컬렉션' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.collection.name).toBe('새 컬렉션');
  });
});

describe('DELETE /api/collections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('id 누락 → 400 반환', async () => {
    const res = await DELETE(makeReq('DELETE'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('id');
  });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await DELETE(makeReq('DELETE', undefined, '?id=c1'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('정상 삭제 → 200 + ok 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    const res = await DELETE(makeReq('DELETE', undefined, '?id=c1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
