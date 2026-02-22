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

import { GET, POST } from '@/app/api/projects/route';

const VALID_UUID = '550e8400-e29b-4d00-a456-426614174000';
const VALID_BODY = { id: VALID_UUID, name: 'My Project' };

function makeGetReq() {
  return new NextRequest('http://localhost/api/projects', { method: 'GET' });
}

function makePostReq(body: unknown, contentLength?: number) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (contentLength !== undefined) headers['content-length'] = String(contentLength);
  return new NextRequest('http://localhost/api/projects', {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  });
}

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }

const PROJECTS = [{ id: VALID_UUID, name: 'My Project', updated_at: '2024-01', created_at: '2024-01' }];

describe('GET /api/projects', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('미인증 → 빈 projects 배열 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.projects).toEqual([]);
  });

  it('인증 성공 → projects 배열 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ data: PROJECTS, error: null, count: 1 }),
          }),
        }),
      }),
    });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.projects).toHaveLength(1);
    expect(body.projects[0].name).toBe('My Project');
  });

  it('DB 오류 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' }, count: null }),
          }),
        }),
      }),
    });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(500);
  });
});

describe('POST /api/projects', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makePostReq(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('content-length 1MB 초과 → 413 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makePostReq(VALID_BODY, 1_000_001));
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error).toContain('too large');
  });

  it('잘못된 UUID → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makePostReq({ id: 'not-a-uuid', name: 'Test' }));
    expect(res.status).toBe(400);
  });

  it('name 없음 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makePostReq({ id: VALID_UUID }));
    expect(res.status).toBe(400);
  });

  it('name 비어있음 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makePostReq({ id: VALID_UUID, name: '' }));
    expect(res.status).toBe(400);
  });

  it('유효한 body → 저장 성공 → { ok: true } 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });
    const res = await POST(makePostReq(VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('DB 오류 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
    });
    const res = await POST(makePostReq(VALID_BODY));
    expect(res.status).toBe(500);
  });

  it('files 필드 포함한 요청 처리', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });
    const res = await POST(makePostReq({ ...VALID_BODY, files: { 'index.ts': 'const x = 1;' } }));
    expect(res.status).toBe(200);
  });
});
