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
  checkRateLimit: vi.fn().mockReturnValue({ success: true, remaining: 2, limit: 3, resetAt: Date.now() + 3_600_000 }),
}));

import { GET, POST } from '@/app/api/snippets/route';
import { checkRateLimit } from '@/lib/rate-limit';

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function makeGetReq(search?: string) {
  return new NextRequest(`http://localhost/api/snippets${search ?? ''}`);
}

function makePostReq(body?: unknown) {
  return new NextRequest('http://localhost/api/snippets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
}

const VALID_SNIPPET = {
  label: '버튼 호버 애니메이션',
  language: 'css',
  category: 'CSS',
  code: '.btn { transition: all 0.2s ease; } .btn:hover { transform: scale(1.05); }',
};

describe('GET /api/snippets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('스니펫 목록 반환', async () => {
    const snippets = [
      { id: 's1', label: '테스트 스니펫', language: 'css', category: 'CSS', code: '.a{}', likes: 5, created_at: '2024-01-01' },
    ];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: snippets, error: null }),
            }),
          }),
        }),
      }),
    });

    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.snippets).toHaveLength(1);
  });

  it('?category=CSS 필터 적용', async () => {
    const eqMock = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
    const secondEqMock = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
    // is_approved eq → then category eq chain
    eqMock.mockReturnValueOnce({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            eq: secondEqMock,
          }),
        }),
      }),
    });

    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqMock }) });

    const res = await GET(makeGetReq('?category=CSS'));
    expect(res.status).toBe(200);
  });

  it('DB 에러 → 500 반환', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'connection error' } }),
            }),
          }),
        }),
      }),
    });

    const res = await GET(makeGetReq());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('Failed');
  });
});

describe('POST /api/snippets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockReturnValue({ success: true, remaining: 2, limit: 3, resetAt: Date.now() + 3_600_000 });
  });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makePostReq(VALID_SNIPPET));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('레이트 리밋 초과 → 429 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    vi.mocked(checkRateLimit).mockReturnValue({ success: false, remaining: 0, limit: 3, resetAt: Date.now() + 3_600_000 });
    const res = await POST(makePostReq(VALID_SNIPPET));
    expect(res.status).toBe(429);
  });

  it('label 누락 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const { label: _label, ...withoutLabel } = VALID_SNIPPET;
    const res = await POST(makePostReq(withoutLabel));
    expect(res.status).toBe(400);
  });

  it('code 누락 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const { code: _code, ...withoutCode } = VALID_SNIPPET;
    const res = await POST(makePostReq(withoutCode));
    expect(res.status).toBe(400);
  });

  it('code 너무 짧음 (10자 미만) → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makePostReq({ ...VALID_SNIPPET, code: '.a{}' }));
    expect(res.status).toBe(400);
  });

  it('정상 제출 → 201 + id 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 's1' }, error: null }),
        }),
      }),
    });

    const res = await POST(makePostReq(VALID_SNIPPET));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('s1');
  });
});
