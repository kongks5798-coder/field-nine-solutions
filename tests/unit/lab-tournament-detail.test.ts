// @vitest-environment node
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

const mockAdminFrom = vi.fn();

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}));

vi.mock('@/lib/lab-agents', () => ({
  getAgent: vi.fn((id: number) => ({ id, name: `Agent ${id}`, type: 'generalist' })),
}));

import { GET } from '@/app/api/lab/tournaments/[id]/route';

const NO_SESSION = { data: { session: null } };
const SESSION = { data: { session: { user: { id: 'u1', email: 'test@test.com' } } } };

function makeReq() {
  return new NextRequest('http://localhost/api/lab/tournaments/t1', { method: 'GET' });
}

function ctx(id = 't1') {
  return { params: Promise.resolve({ id }) };
}

const TOURNAMENT = { id: 't1', season: 1, status: 'play_in', champion: null };
const TEAMS = [
  { id: 'team1', tournament_id: 't1', seed: 1, agent_ids: [1, 2, 3], team_name: 'TeamA', eliminated: false },
  { id: 'team2', tournament_id: 't1', seed: 2, agent_ids: [4, 5, 6], team_name: 'TeamB', eliminated: false },
];
const MATCHES = [{ id: 'm1', tournament_id: 't1', round: 'play_in', match_order: 1 }];
const INNOVATIONS = [{ id: 'inn1', tournament_id: 't1', title: 'Breakthrough', created_at: '2024-01-01' }];

describe('GET /api/lab/tournaments/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('unauthenticated returns 401', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq(), ctx());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns tournament detail with teams, matches, innovations', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    mockAdminFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: TOURNAMENT, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: TEAMS, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: MATCHES, error: null }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: INNOVATIONS, error: null }),
          }),
        }),
      });

    const res = await GET(makeReq(), ctx('t1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tournament.id).toBe('t1');
    expect(body.teams).toHaveLength(2);
    expect(body.teams[0].agents).toHaveLength(3);
    expect(body.matches).toHaveLength(1);
    expect(body.innovations).toHaveLength(1);
  });

  it('tournament not found returns 404', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    mockAdminFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
        }),
      }),
    });
    const res = await GET(makeReq(), ctx('nonexistent'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Tournament not found');
  });

  it('teams query error returns 500', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    mockAdminFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: TOURNAMENT, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'teams query failed' } }),
          }),
        }),
      });
    const res = await GET(makeReq(), ctx('t1'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('teams query failed');
  });

  it('innovations query error returns 500', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    mockAdminFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: TOURNAMENT, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: TEAMS, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: MATCHES, error: null }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'innovations error' } }),
          }),
        }),
      });
    const res = await GET(makeReq(), ctx('t1'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('innovations error');
  });
});
