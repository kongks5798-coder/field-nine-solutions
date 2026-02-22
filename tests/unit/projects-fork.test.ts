import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── vi.hoisted ──
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

vi.mock('@/lib/logger', () => ({
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { POST } from '@/app/api/projects/fork/route';

// ── 헬퍼 ──
const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function makeReq(body: unknown = {}) {
  return new NextRequest('http://localhost/api/projects/fork', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const MOCK_APP = {
  name: 'My App',
  html: '<html><body>Hello</body></html>',
};

function setupMockChain(app: unknown, project: unknown = { id: 'proj-1' }, projErr: unknown = null) {
  let callCount = 0;
  mockFrom.mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // published_apps select
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: app, error: app ? null : { message: 'Not found' } }),
          }),
        }),
      };
    }
    // projects insert
    return {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: project, error: projErr }),
        }),
      }),
    };
  });
}

// ── 테스트 ──
describe('POST /api/projects/fork', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makeReq({ slug: 'my-app' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('slug 없음 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('슬러그');
  });

  it('slug 빈 문자열 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makeReq({ slug: '' }));
    expect(res.status).toBe(400);
  });

  it('존재하지 않는 앱 slug → 404 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    setupMockChain(null);
    const res = await POST(makeReq({ slug: 'nonexistent-app' }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('찾을 수 없');
  });

  it('정상 포크 → projectId 및 name 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    setupMockChain(MOCK_APP);
    const res = await POST(makeReq({ slug: 'my-app' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.projectId).toBe('proj-1');
    expect(body.name).toContain('My App');
    expect(body.name).toContain('포크');
  });

  it('프로젝트 생성 실패 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    setupMockChain(MOCK_APP, null, { message: 'Insert error' });
    const res = await POST(makeReq({ slug: 'my-app' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('실패');
  });

  it('예외 발생 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected error');
    });
    const res = await POST(makeReq({ slug: 'my-app' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('오류');
  });
});
