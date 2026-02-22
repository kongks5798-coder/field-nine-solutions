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

import { GET, DELETE } from '@/app/api/projects/[id]/route';

const PROJECT_ID = '550e8400-e29b-4d00-a456-426614174000';

function makeReq(method: string) {
  return new NextRequest(`http://localhost/api/projects/${PROJECT_ID}`, { method });
}

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }

const PROJECT = { id: PROJECT_ID, name: 'My Project', files: {}, updated_at: '2024-01', created_at: '2024-01' };

describe('GET /api/projects/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq('GET'), { params: Promise.resolve({ id: PROJECT_ID }) });
    expect(res.status).toBe(401);
  });

  it('존재하는 프로젝트 → 200 + project 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: PROJECT, error: null }),
          }),
        }),
      }),
    });
    const res = await GET(makeReq('GET'), { params: Promise.resolve({ id: PROJECT_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.project.id).toBe(PROJECT_ID);
  });

  it('존재하지 않는 프로젝트 → 404 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
          }),
        }),
      }),
    });
    const res = await GET(makeReq('GET'), { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/projects/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await DELETE(makeReq('DELETE'), { params: Promise.resolve({ id: PROJECT_ID }) });
    expect(res.status).toBe(401);
  });

  it('삭제 성공 → { ok: true } 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
    const res = await DELETE(makeReq('DELETE'), { params: Promise.resolve({ id: PROJECT_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('DB 오류 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'constraint violation' } }),
        }),
      }),
    });
    const res = await DELETE(makeReq('DELETE'), { params: Promise.resolve({ id: PROJECT_ID }) });
    expect(res.status).toBe(500);
  });
});
