/**
 * GET  /api/lab/tournaments — 토너먼트 목록
 * POST /api/lab/tournaments — 새 토너먼트 생성
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase-admin';
import { createTeams, createBracketStructure } from '@/lib/lab-engine';

function serverClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
}

// ── GET — 토너먼트 목록 (season DESC) ──────────────────
export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = serverClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();

  // 토너먼트 목록 + 우승 팀명 조인
  const { data: tournaments, error } = await admin
    .from('lab_tournaments')
    .select('*, champion:lab_teams!lab_tournaments_champion_team_id_fkey(id, team_name)')
    .order('season', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tournaments: tournaments ?? [] });
}

// ── POST — 새 토너먼트 생성 ─────────────────────────────
export async function POST(_req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = serverClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();

  // 1. 다음 시즌 번호
  const { data: maxRow } = await admin
    .from('lab_tournaments')
    .select('season')
    .order('season', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSeason = (maxRow?.season ?? 0) + 1;

  // 2. 토너먼트 삽입 (status: pending)
  const { data: tournament, error: tErr } = await admin
    .from('lab_tournaments')
    .insert({ season: nextSeason, status: 'pending' })
    .select('*')
    .single();
  if (tErr || !tournament) {
    return NextResponse.json({ error: tErr?.message ?? 'Insert failed' }, { status: 500 });
  }

  const tournamentId: string = tournament.id;

  // 3. 팀 편성 (10팀)
  const teams = createTeams();

  const teamRows = teams.map((t) => ({
    tournament_id: tournamentId,
    seed: t.seed,
    agent_ids: t.agentIds,
    team_name: t.teamName,
    eliminated: false,
  }));

  const { data: insertedTeams, error: teamErr } = await admin
    .from('lab_teams')
    .insert(teamRows)
    .select('*');

  if (teamErr || !insertedTeams) {
    return NextResponse.json({ error: teamErr?.message ?? 'Team insert failed' }, { status: 500 });
  }

  // seed → team id 매핑 (seed는 1-indexed)
  const seedToTeamId: Record<number, string> = {};
  for (const row of insertedTeams) {
    seedToTeamId[row.seed as number] = row.id as string;
  }

  // 4. 대진표 생성 — play_in, round_8 매치만 삽입
  const bracket = createBracketStructure();
  const initialMatches = bracket.filter(
    (m) => m.round === 'play_in' || m.round === 'round_8',
  );

  const matchRows = initialMatches.map((m) => {
    // teamAIndex, teamBIndex는 0-indexed seed (teams 배열 인덱스)
    // 양수: seed index → seed = index + 1
    // 음수(-1, -2): 플레이인 승자 → 아직 미정
    const teamAId = m.teamAIndex >= 0 ? seedToTeamId[m.teamAIndex + 1] : null;
    const teamBId = m.teamBIndex >= 0 ? seedToTeamId[m.teamBIndex + 1] : null;

    return {
      tournament_id: tournamentId,
      round: m.round,
      match_order: m.matchOrder,
      team_a_id: teamAId,
      team_b_id: teamBId,
      executed: false,
    };
  });

  const { data: insertedMatches, error: matchErr } = await admin
    .from('lab_matches')
    .insert(matchRows)
    .select('*');

  if (matchErr) {
    return NextResponse.json({ error: matchErr.message }, { status: 500 });
  }

  // 5. 상태 업데이트 → play_in
  await admin
    .from('lab_tournaments')
    .update({ status: 'play_in' })
    .eq('id', tournamentId);

  return NextResponse.json(
    {
      tournament: { ...tournament, status: 'play_in' },
      teams: insertedTeams,
      matches: insertedMatches,
    },
    { status: 201 },
  );
}
