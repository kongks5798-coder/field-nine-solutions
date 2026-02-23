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

import { GET, POST, PUT } from '@/app/api/quality-settings/route';

// -- Helpers --
const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function makeGetReq() {
  return new NextRequest('http://localhost/api/quality-settings', { method: 'GET' });
}

function makePostReq(body?: unknown) {
  return new NextRequest('http://localhost/api/quality-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? { autoEval: true }),
  });
}

function makePutReq(body?: unknown) {
  return new NextRequest('http://localhost/api/quality-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? { threshold: 0.8 }),
  });
}

// -- GET Tests --
describe('GET /api/quality-settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: select returns empty rows
    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
  });

  it('미인증 → 401 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeGetReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('인증 성공 → 200 + 기본 설정 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.settings).toBeDefined();
    expect(body.settings.autoEval).toBe(false);
    expect(body.settings.threshold).toBe(0.7);
    expect(body.settings.model).toBe('gpt-4o-mini');
  });

  it('응답에 top-level 기본 설정 필드도 포함', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await GET(makeGetReq());
    const body = await res.json();
    expect(body.autoEval).toBe(false);
    expect(body.threshold).toBe(0.7);
    expect(body.notifyThreshold).toBe(50);
    expect(body.alertInterval).toBe(10);
  });

  it('DB 오류 → 기본 설정으로 펴백', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    mocks.mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      }),
    });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.settings.autoEval).toBe(false);
  });
});

// -- POST Tests --
describe('POST /api/quality-settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it('미인증 → 401 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makePostReq());
    expect(res.status).toBe(401);
  });

  it('인증 성공 → 200 + 설정 저장 메시지', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await POST(makePostReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain('저장');
  });
});

// -- PUT Tests --
describe('PUT /api/quality-settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it('미인증 → 401 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await PUT(makePutReq());
    expect(res.status).toBe(401);
  });

  it('인증 성공 → 200 + 설정 저장 메시지', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await PUT(makePutReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain('저장');
  });
});
