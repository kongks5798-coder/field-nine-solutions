import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mock Supabase ──
const mockGetSession = vi.hoisted(() => vi.fn());
const mockInsert = vi.hoisted(() => vi.fn());
const mockSingleOwner = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingleOwner,
      insert: mockInsert,
    })),
  })),
}));

import { POST } from '@/app/api/projects/publish/route';

const SESSION = { data: { session: { user: { id: 'uid-1', email: 'test@example.com' } } } };
const NO_SESSION = { data: { session: null } };

function makeReq(body: unknown, contentLength?: number) {
  return new NextRequest('http://localhost/api/projects/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(contentLength ? { 'content-length': String(contentLength) } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/projects/publish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(NO_SESSION);
    mockInsert.mockResolvedValue({ error: null });
    mockSingleOwner.mockResolvedValue({ data: { id: 'proj-1' } });
  });

  it('비인증 → 401 반환', async () => {
    const res = await POST(makeReq({ name: '테스트', html: '<h1>hi</h1>' }));
    expect(res.status).toBe(401);
  });

  it('name 없으면 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({ html: '<h1>hi</h1>' }));
    expect(res.status).toBe(400);
  });

  it('html 없으면 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({ name: '테스트 앱' }));
    expect(res.status).toBe(400);
  });

  it('파일 크기 5MB 초과 → 413 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({ name: '앱', html: '<h1>hi</h1>' }, 6_000_000));
    expect(res.status).toBe(413);
  });

  it('정상 요청 → slug와 url 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({ name: '테스트 앱', html: '<h1>Hello</h1>' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('slug');
    expect(body).toHaveProperty('url');
    expect(body.url).toContain('/p/');
  });
});
