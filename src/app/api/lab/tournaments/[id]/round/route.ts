/**
 * POST /api/lab/tournaments/[id]/round — 현재 라운드 실행
 *
 * 1. 현재 라운드의 미실행 매치를 가져옴
 * 2. 각 매치: AI로 양팀 혁신 생성 → 심판 평가 → 승패 결정
 * 3. 라운드 완료 시 다음 라운드 매치 자동 생성
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase-admin';
import { OPENAI_API_BASE } from '@/lib/constants';
import {
  buildInnovationPrompt,
  buildJudgePrompt,
  parseAiJson,
  calcTotal,
  type Innovation,
  type MatchScore,
  type RoundName,
} from '@/lib/lab-engine';

/* ── MatchScore → JSON-safe Record 변환 ────────────── */

/** Supabase jsonb 컬럼에 안전하게 삽입할 수 있도록 MatchScore를 Record로 변환 */
function scoreToRecord(score: MatchScore): Record<string, unknown> {
  return {
    innovation: score.innovation,
    feasibility: score.feasibility,
    impact: score.impact,
    quality: score.quality,
    total: score.total,
  };
}

/* ── Supabase 클라이언트 ─────────────────────────────── */

function serverClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
}

/* ── OpenAI 호출 ─────────────────────────────────────── */

interface JudgeResult {
  scoreA: { innovation: number; feasibility: number; impact: number; quality: number };
  scoreB: { innovation: number; feasibility: number; impact: number; quality: number };
  reasoning: string;
}

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return json.choices[0]?.message?.content ?? '';
}

/* ── 라운드별 maturity 값 ────────────────────────────── */

function maturityForRound(round: RoundName): number {
  switch (round) {
    case 'play_in': return 10;
    case 'round_8':  return 30;
    case 'semi':     return 60;
    case 'final':    return 90;
  }
}

/* ── POST 핸들러 ─────────────────────────────────────── */

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tournamentId } = await params;

  // Auth check
  const cookieStore = await cookies();
  const supabase = serverClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();

  // 1. 토너먼트 조회
  const { data: tournament, error: tErr } = await admin
    .from('lab_tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (tErr || !tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  const currentStatus = tournament.status as string;
  if (currentStatus === 'completed' || currentStatus === 'pending') {
    return NextResponse.json(
      { error: `Cannot execute round: tournament status is "${currentStatus}"` },
      { status: 400 },
    );
  }

  // 현재 라운드 = 토너먼트 status
  const currentRound = currentStatus as RoundName;

  // 2. 현재 라운드의 미실행 매치
  const { data: pendingMatches, error: mErr } = await admin
    .from('lab_matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('round', currentRound)
    .eq('executed', false)
    .order('match_order', { ascending: true });

  if (mErr) return NextResponse.json({ error: '매치 조회에 실패했습니다.' }, { status: 500 });

  if (!pendingMatches || pendingMatches.length === 0) {
    return NextResponse.json({ error: 'No pending matches for current round' }, { status: 400 });
  }

  // 팀 정보 캐시
  const { data: allTeams } = await admin
    .from('lab_teams')
    .select('*')
    .eq('tournament_id', tournamentId);

  const teamMap = new Map<string, { id: string; agent_ids: number[]; seed: number; team_name: string }>();
  for (const t of allTeams ?? []) {
    teamMap.set(t.id as string, t as { id: string; agent_ids: number[]; seed: number; team_name: string });
  }

  // 3. 각 매치 실행
  const executedMatchIds: string[] = [];
  const matchWinners: Map<number, string> = new Map(); // matchOrder → winnerId

  for (const match of pendingMatches) {
    const teamAId = match.team_a_id as string;
    const teamBId = match.team_b_id as string;

    if (!teamAId || !teamBId) {
      return NextResponse.json(
        { error: `Match ${match.id}: missing team assignment` },
        { status: 500 },
      );
    }

    const teamA = teamMap.get(teamAId);
    const teamB = teamMap.get(teamBId);

    if (!teamA || !teamB) {
      return NextResponse.json(
        { error: `Match ${match.id}: team not found` },
        { status: 500 },
      );
    }

    // 3a. 팀 A 혁신 생성
    const promptA = buildInnovationPrompt(teamA.agent_ids);
    const rawA = await callOpenAI(promptA);
    const innovA = parseAiJson<Innovation>(rawA);

    if (!innovA) {
      return NextResponse.json(
        { error: `Failed to parse innovation for team A (match ${match.id})` },
        { status: 500 },
      );
    }

    // 3b. 팀 B 혁신 생성
    const promptB = buildInnovationPrompt(teamB.agent_ids);
    const rawB = await callOpenAI(promptB);
    const innovB = parseAiJson<Innovation>(rawB);

    if (!innovB) {
      return NextResponse.json(
        { error: `Failed to parse innovation for team B (match ${match.id})` },
        { status: 500 },
      );
    }

    // 3c. 심판 평가
    const judgePrompt = buildJudgePrompt(innovA, innovB);
    const rawJudge = await callOpenAI(judgePrompt);
    const judgeResult = parseAiJson<JudgeResult>(rawJudge);

    if (!judgeResult) {
      return NextResponse.json(
        { error: `Failed to parse judge result (match ${match.id})` },
        { status: 500 },
      );
    }

    // 3d. 점수 계산 및 승자 결정
    const scoreA: MatchScore = calcTotal(judgeResult.scoreA);
    const scoreB: MatchScore = calcTotal(judgeResult.scoreB);
    const winnerId = scoreA.total >= scoreB.total ? teamAId : teamBId;
    const loserId = winnerId === teamAId ? teamBId : teamAId;

    // 3e. 혁신 결과물 삽입 (2건)
    const canReenter = currentRound === 'round_8' || currentRound === 'semi' || currentRound === 'final';
    const maturity = maturityForRound(currentRound);

    const innovationRows = [
      {
        tournament_id: tournamentId,
        match_id: match.id as string,
        team_id: teamAId,
        title: innovA.title,
        summary: innovA.summary,
        architecture: innovA.architecture,
        code_snippet: innovA.codeSnippet,
        tech_stack: innovA.techStack,
        scores: scoreToRecord(scoreA),
        round_reached: currentRound,
        maturity,
        can_reenter: canReenter,
        finalized: false,
      },
      {
        tournament_id: tournamentId,
        match_id: match.id as string,
        team_id: teamBId,
        title: innovB.title,
        summary: innovB.summary,
        architecture: innovB.architecture,
        code_snippet: innovB.codeSnippet,
        tech_stack: innovB.techStack,
        scores: scoreToRecord(scoreB),
        round_reached: currentRound,
        maturity,
        can_reenter: canReenter,
        finalized: false,
      },
    ];

    const { error: innovErr } = await admin
      .from('lab_innovations')
      .insert(innovationRows);

    if (innovErr) {
      return NextResponse.json({ error: '혁신 결과물 저장에 실패했습니다.' }, { status: 500 });
    }

    // 3f. 매치 업데이트
    const { error: updateErr } = await admin
      .from('lab_matches')
      .update({
        winner_id: winnerId,
        score_a: scoreToRecord(scoreA),
        score_b: scoreToRecord(scoreB),
        reasoning: judgeResult.reasoning,
        executed: true,
      })
      .eq('id', match.id as string);

    if (updateErr) {
      return NextResponse.json({ error: '매치 결과 업데이트에 실패했습니다.' }, { status: 500 });
    }

    // 3g. 패배 팀 탈락 처리
    await admin
      .from('lab_teams')
      .update({ eliminated: true })
      .eq('id', loserId);

    executedMatchIds.push(match.id as string);
    matchWinners.set(match.match_order as number, winnerId);
  }

  // 4. 라운드 완료 → 다음 라운드 설정
  let nextStatus: string = currentStatus;

  if (currentRound === 'play_in') {
    // 플레이인 완료 → 8강 매치의 미정 팀 채우기
    const winner1 = matchWinners.get(1); // 플레이인1 승자
    const winner2 = matchWinners.get(2); // 플레이인2 승자

    // round_8 matchOrder 1: team_b_id = 플레이인1 승자
    if (winner1) {
      await admin
        .from('lab_matches')
        .update({ team_b_id: winner1 })
        .eq('tournament_id', tournamentId)
        .eq('round', 'round_8')
        .eq('match_order', 1);
    }
    // round_8 matchOrder 2: team_b_id = 플레이인2 승자
    if (winner2) {
      await admin
        .from('lab_matches')
        .update({ team_b_id: winner2 })
        .eq('tournament_id', tournamentId)
        .eq('round', 'round_8')
        .eq('match_order', 2);
    }

    nextStatus = 'round_8';
  } else if (currentRound === 'round_8') {
    // 8강 완료 → 4강 매치 생성
    // 8강 승자 4명 → 4강 2매치
    const r8Winners = await admin
      .from('lab_matches')
      .select('match_order, winner_id')
      .eq('tournament_id', tournamentId)
      .eq('round', 'round_8')
      .order('match_order', { ascending: true });

    const w8 = r8Winners.data ?? [];
    const semiMatches = [
      {
        tournament_id: tournamentId,
        round: 'semi' as const,
        match_order: 1,
        team_a_id: w8.find((m) => m.match_order === 1)?.winner_id ?? null,
        team_b_id: w8.find((m) => m.match_order === 2)?.winner_id ?? null,
        executed: false,
      },
      {
        tournament_id: tournamentId,
        round: 'semi' as const,
        match_order: 2,
        team_a_id: w8.find((m) => m.match_order === 3)?.winner_id ?? null,
        team_b_id: w8.find((m) => m.match_order === 4)?.winner_id ?? null,
        executed: false,
      },
    ];

    const { error: semiErr } = await admin
      .from('lab_matches')
      .insert(semiMatches);

    if (semiErr) {
      return NextResponse.json({ error: '4강 대진 생성에 실패했습니다.' }, { status: 500 });
    }

    nextStatus = 'semi';
  } else if (currentRound === 'semi') {
    // 4강 완료 → 결승 매치 생성
    const semiWinners = await admin
      .from('lab_matches')
      .select('match_order, winner_id')
      .eq('tournament_id', tournamentId)
      .eq('round', 'semi')
      .order('match_order', { ascending: true });

    const ws = semiWinners.data ?? [];
    const finalMatch = {
      tournament_id: tournamentId,
      round: 'final' as const,
      match_order: 1,
      team_a_id: ws.find((m) => m.match_order === 1)?.winner_id ?? null,
      team_b_id: ws.find((m) => m.match_order === 2)?.winner_id ?? null,
      executed: false,
    };

    const { error: finalErr } = await admin
      .from('lab_matches')
      .insert(finalMatch);

    if (finalErr) {
      return NextResponse.json({ error: '결승 대진 생성에 실패했습니다.' }, { status: 500 });
    }

    nextStatus = 'final';
  } else {
    // 결승 완료 → completed
    const finalMatch = await admin
      .from('lab_matches')
      .select('winner_id')
      .eq('tournament_id', tournamentId)
      .eq('round', 'final')
      .eq('executed', true)
      .single();

    const championId = finalMatch.data?.winner_id ?? null;

    await admin
      .from('lab_tournaments')
      .update({
        status: 'completed',
        champion_team_id: championId,
        completed_at: new Date().toISOString(),
      })
      .eq('id', tournamentId);

    // 최종 결과 반환
    return NextResponse.json({
      tournament: {
        ...tournament,
        status: 'completed',
        champion_team_id: championId,
      },
      executedMatches: executedMatchIds,
      round: currentRound,
      nextRound: null,
    });
  }

  // 다음 라운드로 상태 업데이트 (play_in, round_8, semi 이후)
  await admin
    .from('lab_tournaments')
    .update({ status: nextStatus })
    .eq('id', tournamentId);

  return NextResponse.json({
    tournament: { ...tournament, status: nextStatus },
    executedMatches: executedMatchIds,
    round: currentRound,
    nextRound: nextStatus,
  });
}
