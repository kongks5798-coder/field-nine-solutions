import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetSession = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn().mockReturnValue([]) }),
}));

// Mock admin client — auth/me uses Promise.all with two .from().select().eq().single() calls
const mockSingle = vi.fn();
vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
    })),
  })),
}));

import { GET } from '@/app/api/auth/me/route';

function makeReq() {
  return new NextRequest('http://localhost/api/auth/me', { method: 'GET' });
}

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string, email: string) {
  return { data: { session: { user: { id: uid, email, user_metadata: {} } } } };
}

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: both admin profile queries return null (no profile row)
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  it('세션 없을 때 { user: null } 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeNull();
  });

  it('세션 있을 때 user.id, user.email 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-123', 'test@example.com'));
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toMatchObject({ id: 'uid-123', email: 'test@example.com' });
  });

  it('반환 body에 password 등 민감한 필드 없음', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-abc', 'user@test.com'));
    const res = await GET(makeReq());
    const body = await res.json();
    const sensitiveFields = ['password', 'password_hash', 'access_token', 'refresh_token', 'raw_app_meta_data'];
    sensitiveFields.forEach(f => expect(body.user).not.toHaveProperty(f));
    expect(body.user).toHaveProperty('id');
    expect(body.user).toHaveProperty('email');
  });
});
