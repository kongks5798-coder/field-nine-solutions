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

import { GET, POST } from '@/app/api/quality-backup/route';

// -- Helpers --
const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function makeGetReq(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/quality-backup');
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url, { method: 'GET' });
}

function makePostReq(body?: unknown) {
  return new NextRequest('http://localhost/api/quality-backup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
}

function mockSelectChain(data: unknown[] | null, error: { message: string } | null = null) {
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
  };
}

// -- GET Tests --
describe('GET /api/quality-backup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockFrom.mockReturnValue(mockSelectChain([]));
  });

  it('미인증 → 401 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeGetReq({ file: 'chat-log' }));
    expect(res.status).toBe(401);
  });

  it('유효하지 않은 파일 키 → 400 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await GET(makeGetReq({ file: 'invalid-key' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/유효하지 않은/);
  });

  it('파일 키 없음 → 400 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await GET(makeGetReq());
    expect(res.status).toBe(400);
  });

  it('chat-log → 200 + ndjson content-type', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await GET(makeGetReq({ file: 'chat-log' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/x-ndjson');
    expect(res.headers.get('Content-Disposition')).toContain('chat-log.jsonl');
  });

  it('quality-settings → 200 + json content-type', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await GET(makeGetReq({ file: 'quality-settings' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(res.headers.get('Content-Disposition')).toContain('quality-settings.json');
  });

  it('DB 오류 → 빈 펴백 응답 (200)', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    mocks.mockFrom.mockReturnValue(mockSelectChain(null, { message: 'DB error' }));
    const res = await GET(makeGetReq({ file: 'chat-log' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/x-ndjson');
  });
});

// -- POST Tests --
describe('POST /api/quality-backup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'quality_backups') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'b1', name: 'test-backup', status: 'completed' }, error: null }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ count: 10, error: null }),
      };
    });
  });

  it('미인증 → 401 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makePostReq());
    expect(res.status).toBe(401);
  });

  it('인증 성공 → 200 + 백업 생성 메시지', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await POST(makePostReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain('백업');
  });
});