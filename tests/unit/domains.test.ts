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

import { GET, POST } from '@/app/api/domains/route';
import { DELETE } from '@/app/api/domains/[id]/route';

function makeReq(method: string, body?: unknown) {
  const opts: RequestInit = { method };
  if (body) {
    opts.body = JSON.stringify(body);
    opts.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest('http://localhost/api/domains', opts);
}

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }

const DOMAINS = [
  { id: 'd1', domain: 'myapp.com', project_id: null, project_name: '내 앱', status: 'pending', cname_value: 'cname.fieldnine.io', created_at: '2024-01' },
];

describe('GET /api/domains', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('미인증 → 빈 domains 배열 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.domains).toEqual([]);
  });

  it('인증 성공 → domains 배열 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: DOMAINS, error: null }),
          }),
        }),
      }),
    });
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.domains).toHaveLength(1);
    expect(body.domains[0].domain).toBe('myapp.com');
  });

  it('DB 오류 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      }),
    });
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/domains', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makeReq('POST', { domain: 'test.com' }));
    expect(res.status).toBe(401);
  });

  it('유효하지 않은 도메인 (점 없음) → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    // count check mock
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        count: 'exact',
        eq: vi.fn().mockResolvedValue({ count: 0 }),
      }),
    });
    const res = await POST(makeReq('POST', { domain: 'nodot' }));
    expect(res.status).toBe(400);
  });

  it('도메인 10개 초과 시 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // count check
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 10 }),
          }),
        };
      }
      return { select: vi.fn() };
    });
    const res = await POST(makeReq('POST', { domain: 'newdomain.com' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('10개');
  });

  it('중복 도메인 (23505) → 409 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 0 }),
          }),
        };
      }
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate' } }),
          }),
        }),
      };
    });
    const res = await POST(makeReq('POST', { domain: 'existing.com' }));
    expect(res.status).toBe(409);
  });

  it('유효한 도메인 등록 성공 → 200 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 2 }),
          }),
        };
      }
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...DOMAINS[0], domain: 'newapp.com' },
              error: null,
            }),
          }),
        }),
      };
    });
    const res = await POST(makeReq('POST', { domain: 'newapp.com' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.domain).toBeDefined();
  });
});

describe('DELETE /api/domains/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await DELETE(makeReq('DELETE'), { params: Promise.resolve({ id: 'd1' }) });
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
    const res = await DELETE(makeReq('DELETE'), { params: Promise.resolve({ id: 'd1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('DB 오류 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
        }),
      }),
    });
    const res = await DELETE(makeReq('DELETE'), { params: Promise.resolve({ id: 'd1' }) });
    expect(res.status).toBe(500);
  });
});
