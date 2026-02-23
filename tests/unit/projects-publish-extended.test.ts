// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── vi.hoisted mocks ──
const mockGetSession  = vi.hoisted(() => vi.fn());
const mockInsert      = vi.hoisted(() => vi.fn());
const mockSingleOwner = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: mockSingleOwner,
      insert: mockInsert,
    })),
  })),
}));

import { POST } from '@/app/api/projects/publish/route';

const SESSION = {
  data: { session: { user: { id: 'uid-pub-1', email: 'pub@example.com' } } },
};
const NO_SESSION = { data: { session: null } };

function makeReq(method: string, body?: unknown, contentLength?: number): NextRequest {
  return new NextRequest('http://localhost/api/projects/publish', {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(contentLength !== undefined ? { 'content-length': String(contentLength) } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe('POST /api/projects/publish — extended edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(NO_SESSION);
    mockInsert.mockResolvedValue({ error: null });
    mockSingleOwner.mockResolvedValue({ data: { id: 'proj-1' } });
  });

  it('missing name (slug source) returns 400', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq('POST', { html: '<h1>test</h1>' }));
    expect(res.status).toBe(400);
  });

  it('missing html returns 400', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq('POST', { name: 'My App' }));
    expect(res.status).toBe(400);
  });

  it('empty name string returns 400', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq('POST', { name: '', html: '<h1>test</h1>' }));
    expect(res.status).toBe(400);
  });

  it('unauthorized access returns 401', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makeReq('POST', { name: 'App', html: '<h1>hi</h1>' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('successful publish returns 200 with slug and url', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq('POST', { name: 'My Cool App', html: '<h1>Hello World</h1>' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toBeTruthy();
    expect(body.slug).toMatch(/^my-cool-app-[a-f0-9]{6}$/);
    expect(body.url).toContain('/p/');
    expect(body.url).toContain(body.slug);
  });

  it('duplicate slug (unique constraint violation) triggers retry and succeeds', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    let insertCallCount = 0;
    mockInsert.mockImplementation(() => {
      insertCallCount++;
      if (insertCallCount === 1) {
        return Promise.resolve({ error: { code: '23505', message: 'duplicate key' } });
      }
      return Promise.resolve({ error: null });
    });

    const res = await POST(makeReq('POST', { name: 'Test App', html: '<h1>Hi</h1>' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toBeTruthy();
    expect(insertCallCount).toBeGreaterThanOrEqual(2);
  });

  it('5 consecutive slug collisions returns 500', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    mockInsert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });

    const res = await POST(makeReq('POST', { name: 'Clash', html: '<p>test</p>' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('content-length exceeding 5MB returns 413', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq('POST', { name: 'Big', html: '<p>x</p>' }, 5_000_001));
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error).toMatch(/too large|5MB/i);
  });

  it('name longer than 100 chars returns 400', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const longName = 'a'.repeat(101);
    const res = await POST(makeReq('POST', { name: longName, html: '<p>test</p>' }));
    expect(res.status).toBe(400);
  });

  it('non-collision DB error returns 500 immediately (no retry)', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    mockInsert.mockResolvedValue({ error: { code: '42P01', message: 'relation does not exist' } });

    const res = await POST(makeReq('POST', { name: 'DBErr', html: '<p>hi</p>' }));
    expect(res.status).toBe(500);
  });

  it('projectId ownership check — forbidden when project not owned', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    mockSingleOwner.mockResolvedValue({ data: null });

    const res = await POST(makeReq('POST', { projectId: 'proj-other', name: 'Stolen', html: '<p>x</p>' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/forbidden/i);
  });
});
