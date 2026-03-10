import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// next/headers는 서버 전용 모듈이라 테스트 환경에서 직접 임포트 불가
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [] }),
}));

// serviceClient() 와 getAuthUser() 내부 userClient 둘 다 createServerClient를 호출하므로
// 호출 순서에 따라 다른 mock 반환값을 설정한다.
const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true, remaining: 4, limit: 5, resetAt: Date.now() + 60_000 }),
}));

import { GET, POST, DELETE } from '@/app/api/published/[slug]/comments/route';
import { checkRateLimit } from '@/lib/rate-limit';

const PARAMS_RESOLVED = { params: Promise.resolve({ slug: 'my-app' }) };

function makeReq(method: string, body?: unknown, search?: string) {
  const url = `http://localhost/api/published/my-app/comments${search ?? ''}`;
  return new NextRequest(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

function userOf(id: string) {
  return { data: { user: { id } } };
}

const NO_USER = { data: { user: null } };

describe('GET /api/published/[slug]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증 없이도 댓글 목록 반환 (200)', async () => {
    const comments = [
      { id: 'cmt1', content: '좋아요!', created_at: '2024-01-01', user_id: 'u1', profiles: { full_name: '홍길동', avatar_url: null } },
    ];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: comments, error: null }),
          }),
        }),
      }),
    });

    const res = await GET(makeReq('GET'), PARAMS_RESOLVED);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.comments).toHaveLength(1);
    expect(body.comments[0].content).toBe('좋아요!');
  });

  it('DB 에러 → 빈 배열로 안전하게 반환 (200)', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      }),
    });

    const res = await GET(makeReq('GET'), PARAMS_RESOLVED);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.comments).toEqual([]);
  });
});

describe('POST /api/published/[slug]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockReturnValue({ success: true, remaining: 4, limit: 5, resetAt: Date.now() + 60_000 });
  });

  it('레이트 리밋 초과 → 429 반환', async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ success: false, remaining: 0, limit: 5, resetAt: Date.now() + 60_000 });
    const res = await POST(makeReq('POST', { content: '댓글입니다' }), PARAMS_RESOLVED);
    expect(res.status).toBe(429);
  });

  it('미인증 → 401 반환', async () => {
    mockGetUser.mockResolvedValue(NO_USER);
    const res = await POST(makeReq('POST', { content: '댓글입니다' }), PARAMS_RESOLVED);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('로그인');
  });

  it('content 빈 문자열 → 400 반환', async () => {
    mockGetUser.mockResolvedValue(userOf('u1'));
    const res = await POST(makeReq('POST', { content: '' }), PARAMS_RESOLVED);
    expect(res.status).toBe(400);
  });

  it('정상 댓글 작성 → 200 + comment 반환', async () => {
    mockGetUser.mockResolvedValue(userOf('u1'));
    const newComment = { id: 'cmt1', content: '멋진 앱이에요!', created_at: '2024-01-01', user_id: 'u1' };
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: newComment, error: null }),
        }),
      }),
    });

    const res = await POST(makeReq('POST', { content: '멋진 앱이에요!' }), PARAMS_RESOLVED);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.comment.content).toBe('멋진 앱이에요!');
  });
});

describe('DELETE /api/published/[slug]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('id 누락 → 400 반환', async () => {
    const res = await DELETE(makeReq('DELETE'), PARAMS_RESOLVED);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('ID');
  });

  it('미인증 → 401 반환', async () => {
    mockGetUser.mockResolvedValue(NO_USER);
    const res = await DELETE(makeReq('DELETE', undefined, '?id=cmt1'), PARAMS_RESOLVED);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('로그인');
  });

  it('정상 삭제 → 200 + ok 반환', async () => {
    mockGetUser.mockResolvedValue(userOf('u1'));
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }),
    });

    const res = await DELETE(makeReq('DELETE', undefined, '?id=cmt1'), PARAMS_RESOLVED);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
