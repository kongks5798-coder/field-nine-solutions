// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// -- Hoisted mocks --
const mocks = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mocks.mockGetSession },
  })),
}));

vi.mock('@/utils/supabase/admin', () => ({
  admin: { from: mocks.mockFrom },
}));

import { POST } from '@/app/api/ai-quality-eval/route';

// -- Helpers --
const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/ai-quality-eval', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// -- Tests --
describe('POST /api/ai-quality-eval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: insert succeeds
    mocks.mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it('미인증 → 401 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makeReq({ prompt: 'test' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('인증 성공 + 평가 성공 → 200 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await POST(makeReq({ prompt: 'hello', response: 'world', expected: 'world' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.score).toBeGreaterThanOrEqual(0);
    expect(typeof body.feedback).toBe('string');
  });

  it('body 필드가 응답에 반영됨', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await POST(makeReq({ prompt: 'p1', response: 'r1', expected: 'e1' }));
    const body = await res.json();
    expect(body.prompt).toBe('p1');
    expect(body.response).toBe('r1');
    expect(body.expected).toBe('e1');
  });

  it('빈 body → 기본값 빈 문자열 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.prompt).toBe('');
    expect(body.response).toBe('');
    expect(body.expected).toBe('');
  });

  it('응답에 metrics 필드 포함', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await POST(makeReq({ prompt: 'test', response: 'answer', expected: 'answer' }));
    const body = await res.json();
    expect(body).toHaveProperty('metrics');
    expect(typeof body.metrics).toBe('object');
  });

  it('DB 삽입 실패 → 그레이스풀 디그레이드', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    mocks.mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: 'insert failed' } }),
    });
    const res = await POST(makeReq({ prompt: 'test' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.score).toBe(0);
    expect(body.feedback).toContain('오류');
  });
});
