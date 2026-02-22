import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { GET } from '@/app/api/published/route';

const APPS = [
  { slug: 'app-1', name: 'App One', views: 100, user_id: 'u1', created_at: '2024-01-01', updated_at: '2024-01-02' },
  { slug: 'app-2', name: 'App Two', views: 50,  user_id: 'u2', created_at: '2024-01-01', updated_at: '2024-01-02' },
];

function setupMock(data: unknown, error: unknown = null) {
  mockLimit.mockResolvedValue({ data, error });
  mockOrder.mockReturnValue({ limit: mockLimit });
  mockSelect.mockReturnValue({ order: mockOrder });
  mockFrom.mockReturnValue({ select: mockSelect });
}

function makeReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/published');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: 'GET' });
}

describe('GET /api/published', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('기본 요청 → apps 배열 반환', async () => {
    setupMock(APPS);
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apps).toHaveLength(2);
    expect(body.apps[0].slug).toBe('app-1');
  });

  it('Supabase 오류 시 빈 배열 반환', async () => {
    setupMock(null, { message: 'DB error' });
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apps).toEqual([]);
  });

  it('limit=5 → limit(5) 호출', async () => {
    setupMock(APPS.slice(0, 1));
    await GET(makeReq({ limit: '5' }));
    expect(mockLimit).toHaveBeenCalledWith(5);
  });

  it('limit=100 → max 50으로 clamp', async () => {
    setupMock([]);
    await GET(makeReq({ limit: '100' }));
    expect(mockLimit).toHaveBeenCalledWith(50);
  });

  it('sort=newest → created_at 기준 정렬', async () => {
    setupMock([]);
    await GET(makeReq({ sort: 'newest' }));
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('sort=views (기본) → views 기준 정렬', async () => {
    setupMock([]);
    await GET(makeReq());
    expect(mockOrder).toHaveBeenCalledWith('views', { ascending: false });
  });

  it('data가 null일 때 빈 배열 반환', async () => {
    setupMock(null);
    const res = await GET(makeReq());
    const body = await res.json();
    expect(body.apps).toEqual([]);
  });
});
