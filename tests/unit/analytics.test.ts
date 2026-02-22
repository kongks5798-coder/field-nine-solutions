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

import { GET } from '@/app/api/analytics/route';

function makeReq() {
  return new NextRequest('http://localhost/api/analytics', { method: 'GET' });
}

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }

const APPS = [{ slug: 'app-1', name: 'App', views: 200, created_at: '2024-01', updated_at: '2024-02' }];
const PROJECTS = [{ id: 'p1', name: 'Proj', updated_at: '2024-01' }];
const TOKEN = { data: { balance: 75000 } };

function setupMockChain(appsData: unknown, projectsData: unknown, tokenData: { data: { balance: number } } | { data: null }) {
  const appsChain = { data: appsData, error: null };
  const projectsChain = { data: projectsData, error: null };
  const tokenChain = tokenData;

  let callCount = 0;
  mockFrom.mockImplementation(() => {
    callCount++;
    const call = callCount;
    if (call === 1) {
      // published_apps
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue(appsChain),
          }),
        }),
      };
    } else if (call === 2) {
      // projects
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue(projectsChain),
          }),
        }),
      };
    } else {
      // user_tokens
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(tokenChain),
          }),
        }),
      };
    }
  });
}

describe('GET /api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('인증 성공 → 통계 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    setupMockChain(APPS, PROJECTS, TOKEN);
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalViews).toBe(200);
    expect(body.appCount).toBe(1);
    expect(body.projectCount).toBe(1);
    expect(body.tokenBalance).toBe(75000);
  });

  it('토큰 데이터 없을 때 기본값 50000 사용', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-2'));
    setupMockChain([], [], { data: null });
    const res = await GET(makeReq());
    const body = await res.json();
    expect(body.tokenBalance).toBe(50000);
  });

  it('앱이 없을 때 totalViews = 0', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-3'));
    setupMockChain([], [], TOKEN);
    const res = await GET(makeReq());
    const body = await res.json();
    expect(body.totalViews).toBe(0);
    expect(body.appCount).toBe(0);
  });

  it('여러 앱의 views 합산', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-4'));
    const multiApps = [
      { slug: 'a1', name: 'A', views: 100, created_at: '', updated_at: '' },
      { slug: 'a2', name: 'B', views: 250, created_at: '', updated_at: '' },
    ];
    setupMockChain(multiApps, [], TOKEN);
    const res = await GET(makeReq());
    const body = await res.json();
    expect(body.totalViews).toBe(350);
  });
});
