// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mock fns ─────────────────────────────────────────────────────────
const mockGetUser = vi.hoisted(() => vi.fn());
const mockSelect  = vi.hoisted(() => vi.fn());
const mockInsert  = vi.hoisted(() => vi.fn());
const mockDelete  = vi.hoisted(() => vi.fn());
const mockEq      = vi.hoisted(() => vi.fn());
const mockOrder   = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select:  mockSelect,
      insert:  mockInsert,
      delete:  mockDelete,
      eq:      mockEq,
      order:   mockOrder,
    })),
  })),
}));

import { GET, POST, DELETE } from '@/app/api/bookmarks/route';

// ── Helpers ──────────────────────────────────────────────────────────────────
const AUTHED_USER = { id: 'user-abc', email: 'test@example.com' };

function makeReq(method: string, body?: unknown): NextRequest {
  return new NextRequest('http://localhost/api/bookmarks', {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

const BOOKMARKS = [
  { app_slug: 'my-cool-app', created_at: '2026-01-01T00:00:00Z' },
  { app_slug: 'another-app', created_at: '2026-01-02T00:00:00Z' },
];

describe('GET /api/bookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated request', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('returns bookmarks array for authenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER } });
    // Chain: .from().select().eq().order() → resolve
    mockOrder.mockResolvedValue({ data: BOOKMARKS, error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('bookmarks');
    expect(Array.isArray(body.bookmarks)).toBe(true);
    expect(body.bookmarks).toHaveLength(2);
  });

  it('returns 500 when DB query fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER } });
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/bookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when slug is missing', async () => {
    // No auth check needed — route validates slug before auth
    const res = await POST(makeReq('POST', {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 401 for unauthenticated request with valid slug', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeReq('POST', { slug: 'some-app' }));
    expect(res.status).toBe(401);
  });

  it('creates bookmark and returns ok:true', async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER } });
    mockInsert.mockResolvedValue({ error: null });

    const res = await POST(makeReq('POST', { slug: 'new-app' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns ok:true with already:true for duplicate bookmark', async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER } });
    mockInsert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });

    const res = await POST(makeReq('POST', { slug: 'already-bookmarked-app' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.already).toBe(true);
  });

  it('returns 500 on unexpected DB error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER } });
    mockInsert.mockResolvedValue({ error: { code: '42501', message: 'permission denied' } });

    const res = await POST(makeReq('POST', { slug: 'some-app' }));
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/bookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when slug is missing', async () => {
    const res = await DELETE(makeReq('DELETE', {}));
    expect(res.status).toBe(400);
  });

  it('returns 401 for unauthenticated request', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await DELETE(makeReq('DELETE', { slug: 'some-app' }));
    expect(res.status).toBe(401);
  });

  it('removes bookmark and returns ok:true', async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER } });
    // Chain: .from().delete().eq().eq() → resolve
    const mockEq2 = vi.fn().mockResolvedValue({ error: null });
    mockEq.mockReturnValue({ eq: mockEq2 });
    mockDelete.mockReturnValue({ eq: mockEq });

    const res = await DELETE(makeReq('DELETE', { slug: 'app-to-remove' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns 500 when delete fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER } });
    const mockEq2 = vi.fn().mockResolvedValue({ error: { message: 'delete failed' } });
    mockEq.mockReturnValue({ eq: mockEq2 });
    mockDelete.mockReturnValue({ eq: mockEq });

    const res = await DELETE(makeReq('DELETE', { slug: 'bad-app' }));
    expect(res.status).toBe(500);
  });
});
