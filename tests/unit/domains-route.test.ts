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

function makeReq(method: string, body?: unknown) {
  if (body) {
    return new NextRequest('http://localhost/api/domains', {
      method,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new NextRequest('http://localhost/api/domains', { method });
}

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

const SAMPLE_DOMAIN = {
  id: 'd1',
  domain: 'example.com',
  project_id: null,
  project_name: '내 앱',
  status: 'pending',
  cname_value: 'cname.fieldnine.io',
  created_at: '2025-01-01',
};

describe('GET /api/domains — 인증 필요', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('미인증 시 빈 domains 배열 반환 (200)', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.domains).toEqual([]);
  });

  it('인증된 사용자의 도메인 목록 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [SAMPLE_DOMAIN, { ...SAMPLE_DOMAIN, id: 'd2', domain: 'another.com' }],
              error: null,
            }),
          }),
        }),
      }),
    });
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.domains).toHaveLength(2);
    expect(body.domains[0].domain).toBe('example.com');
    expect(body.domains[1].domain).toBe('another.com');
  });
});

describe('POST /api/domains — 도메인 등록', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('도메인 등록 성공', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // count check
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 1 }),
          }),
        };
      }
      // insert
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...SAMPLE_DOMAIN, domain: 'newsite.com' },
              error: null,
            }),
          }),
        }),
      };
    });
    const res = await POST(makeReq('POST', { domain: 'newsite.com' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.domain).toBeDefined();
    expect(body.domain.domain).toBe('newsite.com');
  });

  it('중복 도메인 거부 — 409 반환', async () => {
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
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '23505', message: 'duplicate key value violates unique constraint' },
            }),
          }),
        }),
      };
    });
    const res = await POST(makeReq('POST', { domain: 'existing.com' }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('이미 등록된');
  });

  it('잘못된 도메인 형식 거부 — 점(.) 없는 도메인 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    // dot check (line 52-54) happens before count query, so no from() mock needed
    const res = await POST(makeReq('POST', { domain: 'invaliddomainwithoutdot' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('미인증 시 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makeReq('POST', { domain: 'test.com' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });
});
