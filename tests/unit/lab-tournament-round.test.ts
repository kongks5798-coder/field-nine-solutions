// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  mockAdminFrom: vi.fn(),
  mockGetSession: vi.fn(),
  mockFetch: vi.fn(),
}));

// next/headers cookies() 모킹
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
  }),
}));

// Supabase SSR — 인증용 클라이언트
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mocks.mockGetSession },
  })),
}));

// Supabase Admin — DB 조작용 클라이언트
vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({ from: mocks.mockAdminFrom })),
}));

// lab-engine 모킹 — 실제 프롬프트/파싱 로직은 단위테스트 불필요
vi.mock('@/lib/lab-engine', () => ({
  buildInnovationPrompt: vi.fn().mockReturnValue('innovation prompt'),
  buildJudgePrompt: vi.fn().mockReturnValue('judge prompt'),
  parseAiJson: vi.fn().mockImplementation((_text: string) => {
    // 호출 순서로 혁신A, 혁신B, 심판결과 구분
    return null; // 기본값 — 각 테스트에서 오버라이드
  }),
  calcTotal: vi.fn().mockImplementation((s: { innovation: number; feasibility: number; impact: number; quality: number }) => ({
    ...s,
    total: s.innovation + s.feasibility + s.impact + s.quality,
  })),
}));

import { POST } from '@/app/api/lab/tournaments/[id]/round/route';

// ── 헬퍼 ────────────────────────────────────────────────────────────────────
function makeReq() {
  return new NextRequest('http://localhost/api/lab/tournaments/t1/round', { method: 'POST' });
}

function makeParams(id = 't1') {
  return { params: Promise.resolve({ id }) };
}

/** 세션 있음 */
const SESSION_OK = { data: { session: { user: { id: 'user-1' } } } };
const SESSION_NONE = { data: { session: null } };

/** 혁신 객체 */
const INNOV_A = { title: '혁신A', summary: '요약A', architecture: '아키A', codeSnippet: 'code A', techStack: ['TS'] };
const INNOV_B = { title: '혁신B', summary: '요약B', architecture: '아키B', codeSnippet: 'code B', techStack: ['Go'] };
const JUDGE_RESULT = {
  scoreA: { innovation: 25, feasibility: 20, impact: 20, quality: 15 },
  scoreB: { innovation: 20, feasibility: 15, impact: 15, quality: 10 },
  reasoning: '팀A가 더 혁신적입니다.',
};

/** OpenAI API 응답 모킹 */
function mockOpenAIResponse(content: string) {
  return {
    ok: true,
    json: () => Promise.resolve({
      choices: [{ message: { content } }],
    }),
    text: () => Promise.resolve(content),
  };
}

/**
 * 관리자 DB 체인 모킹 — 테이블별 분기
 * 토너먼트 조회, 매치 조회, 팀 조회, 혁신 삽입, 매치 업데이트, 팀 업데이트, 토너먼트 상태 업데이트
 */
function setupAdminMocks(opts: {
  tournament?: Record<string, unknown> | null;
  tournamentError?: { message: string } | null;
  pendingMatches?: unknown[] | null;
  matchError?: { message: string } | null;
  teams?: unknown[];
}) {
  let tournamentCallCount = 0;
  let matchCallCount = 0;

  mocks.mockAdminFrom.mockImplementation((table: string) => {
    if (table === 'lab_tournaments') {
      tournamentCallCount++;
      if (tournamentCallCount === 1) {
        // 토너먼트 조회
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: opts.tournament,
                error: opts.tournamentError ?? null,
              }),
            }),
          }),
        };
      }
      // 토너먼트 상태 업데이트
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    }

    if (table === 'lab_matches') {
      matchCallCount++;
      if (matchCallCount === 1) {
        // 미실행 매치 조회
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: opts.pendingMatches,
                    error: opts.matchError ?? null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      // 매치 업데이트 또는 다음 라운드 매치 삽입
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [] }),
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { winner_id: 'team-a' } }),
              }),
            }),
          }),
        }),
      };
    }

    if (table === 'lab_teams') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: opts.teams ?? [] }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    }

    if (table === 'lab_innovations') {
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }

    return { select: vi.fn().mockResolvedValue({ data: null }) };
  });
}

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('POST /api/lab/tournaments/[id]/round', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetSession.mockResolvedValue(SESSION_OK);
    globalThis.fetch = mocks.mockFetch as unknown as typeof fetch;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    process.env.OPENAI_API_KEY = 'sk-test';
  });

  it('미인증 사용자 → 401 반환', async () => {
    mocks.mockGetSession.mockResolvedValueOnce(SESSION_NONE);

    const res = await POST(makeReq(), makeParams());
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('존재하지 않는 토너먼트 → 404 반환', async () => {
    setupAdminMocks({
      tournament: null,
      tournamentError: { message: 'not found' },
      pendingMatches: [],
      teams: [],
    });

    const res = await POST(makeReq(), makeParams('nonexistent'));
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe('Tournament not found');
  });

  it('완료된 토너먼트 → 400 반환', async () => {
    setupAdminMocks({
      tournament: { id: 't1', status: 'completed', name: 'Test' },
      pendingMatches: [],
      teams: [],
    });

    const res = await POST(makeReq(), makeParams());
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('completed');
  });

  it('대기중(pending) 상태 토너먼트 → 400 반환', async () => {
    setupAdminMocks({
      tournament: { id: 't1', status: 'pending', name: 'Test' },
      pendingMatches: [],
      teams: [],
    });

    const res = await POST(makeReq(), makeParams());
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('pending');
  });

  it('미실행 매치 없음 → 400 반환', async () => {
    setupAdminMocks({
      tournament: { id: 't1', status: 'play_in', name: 'Test' },
      pendingMatches: [],
      teams: [],
    });

    const res = await POST(makeReq(), makeParams());
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('No pending matches');
  });

  it('라운드 실행 성공 → 200 + 실행 결과 반환', async () => {
    // parseAiJson을 호출 순서대로 혁신A, 혁신B, 심판결과 반환
    const { parseAiJson } = await import('@/lib/lab-engine');
    const mockParseAiJson = vi.mocked(parseAiJson);
    mockParseAiJson
      .mockReturnValueOnce(INNOV_A)   // 팀A 혁신
      .mockReturnValueOnce(INNOV_B)   // 팀B 혁신
      .mockReturnValueOnce(JUDGE_RESULT); // 심판 결과

    // OpenAI fetch 3회 호출 (혁신A, 혁신B, 심판)
    mocks.mockFetch
      .mockResolvedValueOnce(mockOpenAIResponse(JSON.stringify(INNOV_A)))
      .mockResolvedValueOnce(mockOpenAIResponse(JSON.stringify(INNOV_B)))
      .mockResolvedValueOnce(mockOpenAIResponse(JSON.stringify(JUDGE_RESULT)));

    setupAdminMocks({
      tournament: { id: 't1', status: 'play_in', name: 'Test Tournament' },
      pendingMatches: [
        { id: 'm1', match_order: 1, team_a_id: 'team-a', team_b_id: 'team-b', round: 'play_in', executed: false },
      ],
      teams: [
        { id: 'team-a', agent_ids: [1, 2, 3], seed: 7, team_name: 'Alpha' },
        { id: 'team-b', agent_ids: [4, 5, 6], seed: 10, team_name: 'Beta' },
      ],
    });

    const res = await POST(makeReq(), makeParams());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.executedMatches).toContain('m1');
    expect(body.round).toBe('play_in');
    expect(body.nextRound).toBe('round_8');
  });

  it('OpenAI API 실패 → 500 반환 (혁신 파싱 실패)', async () => {
    const { parseAiJson } = await import('@/lib/lab-engine');
    const mockParseAiJson = vi.mocked(parseAiJson);
    // 혁신A 파싱 실패
    mockParseAiJson.mockReturnValueOnce(null);

    mocks.mockFetch.mockResolvedValueOnce(mockOpenAIResponse('invalid json'));

    setupAdminMocks({
      tournament: { id: 't1', status: 'play_in', name: 'Test Tournament' },
      pendingMatches: [
        { id: 'm1', match_order: 1, team_a_id: 'team-a', team_b_id: 'team-b', round: 'play_in', executed: false },
      ],
      teams: [
        { id: 'team-a', agent_ids: [1, 2, 3], seed: 7, team_name: 'Alpha' },
        { id: 'team-b', agent_ids: [4, 5, 6], seed: 10, team_name: 'Beta' },
      ],
    });

    const res = await POST(makeReq(), makeParams());
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toContain('Failed to parse innovation');
  });
});
