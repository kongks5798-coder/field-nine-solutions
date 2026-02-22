import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetSession = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: mockFrom,
  })),
}));

import { GET, DELETE } from '@/app/api/published/[slug]/route';

function makeReq(method: string) {
  return new NextRequest('http://localhost/api/published/my-app', { method });
}

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }

const APP_DATA = { slug: 'my-app', name: 'My App', html: '<html></html>', views: 100, created_at: '2024-01' };

describe('GET /api/published/[slug]', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('존재하는 slug → 200 + app 반환', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: APP_DATA, error: null }),
        }),
      }),
    });
    const res = await GET(makeReq('GET'), { params: Promise.resolve({ slug: 'my-app' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.app.slug).toBe('my-app');
  });

  it('존재하지 않는 slug → 404 반환', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        }),
      }),
    });
    const res = await GET(makeReq('GET'), { params: Promise.resolve({ slug: 'nonexistent' }) });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Not found');
  });
});

describe('DELETE /api/published/[slug]', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await DELETE(makeReq('DELETE'), { params: Promise.resolve({ slug: 'my-app' }) });
    expect(res.status).toBe(401);
  });

  it('삭제 성공 → { ok: true } 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
    const res = await DELETE(makeReq('DELETE'), { params: Promise.resolve({ slug: 'my-app' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('DB 오류 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'FK constraint' } }),
        }),
      }),
    });
    const res = await DELETE(makeReq('DELETE'), { params: Promise.resolve({ slug: 'my-app' }) });
    expect(res.status).toBe(500);
  });
});
