// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── 모킹 ────────────────────────────────────────────────────────────────────
const mockGetSession = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}));

vi.mock('@/lib/logger', () => ({
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// next/headers cookies() 모킹
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn().mockReturnValue([]) }),
}));

const mockAdminFrom = vi.fn();

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}));

// lab-engine 모킹 — 팀 편성 및 대진표 생성
vi.mock('@/lib/lab-engine', () => ({
  createTeams: vi.fn(() =>
    Array.from({ length: 10 }, (_, i) => ({
      seed: i + 1,
      agentIds: [i * 3 + 1, i * 3 + 2, i * 3 + 3],
      teamName: `팀${i + 1}`,
      eliminated: false,
    })),
  ),
  createBracketStructure: vi.fn(() => [
    { round: 'play_in', matchOrder: 1, teamAIndex: 6, teamBIndex: 9 },
    { round: 'play_in', matchOrder: 2, teamAIndex: 7, teamBIndex: 8 },
    { round: 'round_8', matchOrder: 1, teamAIndex: 0, teamBIndex: -1 },
    { round: 'round_8', matchOrder: 2, teamAIndex: 1, teamBIndex: -2 },
    { round: 'round_8', matchOrder: 3, teamAIndex: 2, teamBIndex: 5 },
    { round: 'round_8', matchOrder: 4, teamAIndex: 3, teamBIndex: 4 },
    { round: 'semi', matchOrder: 1, teamAIndex: -11, teamBIndex: -12 },
    { round: 'semi', matchOrder: 2, teamAIndex: -13, teamBIndex: -14 },
    { round: 'final', matchOrder: 1, teamAIndex: -21, teamBIndex: -22 },
  ]),
}));

import { GET, POST } from '@/app/api/lab/tournaments/route';

// ── 헬퍼 ────────────────────────────────────────────────────────────────────
const NO_SESSION = { data: { session: null } };
const SESSION = {
  data: { session: { user: { id: 'test-uid', email: 'test@test.com' } } },
};

function makeGetReq() {
  return new NextRequest('http://localhost/api/lab/tournaments', { method: 'GET' });
}

function makePostReq() {
  return new NextRequest('http://localhost/api/lab/tournaments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

const SAMPLE_TOURNAMENTS = [
  { id: 't1', season: 3, status: 'final', champion: { id: 'team1', team_name: '챔피언팀' } },
  { id: 't2', season: 2, status: 'completed', champion: null },
  { id: 't3', season: 1, status: 'completed', champion: { id: 'team5', team_name: '우승팀' } },
];

// ── GET 테스트 ──────────────────────────────────────────────────────────────
describe('GET /api/lab/tournaments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  // ── 1. 미인증 → 401 ────────────────────────────────────────────────────
  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeGetReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── 2. 토너먼트 목록 반환 → 200 ───────────────────────────────────────
  it('토너먼트 목록 반환 → 200', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    mockAdminFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: SAMPLE_TOURNAMENTS, error: null }),
      }),
    });

    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tournaments).toHaveLength(3);
    expect(body.tournaments[0].season).toBe(3);
    expect(body.tournaments[0].champion.team_name).toBe('챔피언팀');
  });

  // ── 3. 빈 목록 → 200 + 빈 배열 ────────────────────────────────────────
  it('빈 토너먼트 목록 → 200 + 빈 배열', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    mockAdminFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tournaments).toEqual([]);
  });

  // ── 4. data가 null → 200 + 빈 배열 ────────────────────────────────────
  it('data null → 200 + 빈 배열 (null 안전처리)', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    mockAdminFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tournaments).toEqual([]);
  });

  // ── 5. DB 오류 → 500 ──────────────────────────────────────────────────
  it('DB 오류 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    mockAdminFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB connection failed' } }),
      }),
    });

    const res = await GET(makeGetReq());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch tournaments');
  });
});

// ── POST 테스트 ─────────────────────────────────────────────────────────────
describe('POST /api/lab/tournaments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  // ── 6. 미인증 → 401 ────────────────────────────────────────────────────
  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makePostReq());
    expect(res.status).toBe(401);
  });

  // ── 7. 새 토너먼트 생성 → 201 ─────────────────────────────────────────
  it('새 토너먼트 생성 → 201 + tournament, teams, matches', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    // 시즌 번호 조회 (기존 최대 시즌 = 3)
    const seasonQuery = {
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { season: 3 }, error: null }),
          }),
        }),
      }),
    };

    // 토너먼트 삽입
    const insertedTournament = { id: 't-new', season: 4, status: 'pending' };
    const tournamentInsert = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: insertedTournament, error: null }),
        }),
      }),
    };

    // 팀 삽입 — seed와 id 포함
    const insertedTeams = Array.from({ length: 10 }, (_, i) => ({
      id: `team-${i + 1}`,
      tournament_id: 't-new',
      seed: i + 1,
      agent_ids: [i * 3 + 1, i * 3 + 2, i * 3 + 3],
      team_name: `팀${i + 1}`,
      eliminated: false,
    }));
    const teamInsert = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: insertedTeams, error: null }),
      }),
    };

    // 매치 삽입
    const insertedMatches = [
      { id: 'm1', round: 'play_in', match_order: 1 },
      { id: 'm2', round: 'play_in', match_order: 2 },
      { id: 'm3', round: 'round_8', match_order: 1 },
      { id: 'm4', round: 'round_8', match_order: 2 },
      { id: 'm5', round: 'round_8', match_order: 3 },
      { id: 'm6', round: 'round_8', match_order: 4 },
    ];
    const matchInsert = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: insertedMatches, error: null }),
      }),
    };

    // 상태 업데이트
    const statusUpdate = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    };

    // from() 호출 순서: lab_tournaments(시즌), lab_tournaments(삽입), lab_teams, lab_matches, lab_tournaments(업데이트)
    mockAdminFrom
      .mockReturnValueOnce(seasonQuery)      // 시즌 번호 조회
      .mockReturnValueOnce(tournamentInsert)  // 토너먼트 삽입
      .mockReturnValueOnce(teamInsert)        // 팀 삽입
      .mockReturnValueOnce(matchInsert)       // 매치 삽입
      .mockReturnValueOnce(statusUpdate);     // 상태 업데이트

    const res = await POST(makePostReq());
    expect(res.status).toBe(201);
    const body = await res.json();

    // 토너먼트 정보 확인
    expect(body.tournament.id).toBe('t-new');
    expect(body.tournament.status).toBe('play_in');

    // 팀 10개 생성 확인
    expect(body.teams).toHaveLength(10);

    // 매치 생성 확인 (play_in 2개 + round_8 4개)
    expect(body.matches).toHaveLength(6);
  });

  // ── 8. 토너먼트 삽입 실패 → 500 ───────────────────────────────────────
  it('토너먼트 삽입 실패 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    // 시즌 번호 조회 (첫 토너먼트)
    const seasonQuery = {
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    };

    // 토너먼트 삽입 실패
    const tournamentInsertFail = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert conflict' } }),
        }),
      }),
    };

    mockAdminFrom
      .mockReturnValueOnce(seasonQuery)
      .mockReturnValueOnce(tournamentInsertFail);

    const res = await POST(makePostReq());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('토너먼트 생성에 실패했습니다.');
  });
});
