/**
 * GET /api/lab/tournaments/[id] — 토너먼트 상세 정보
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase-admin';
import { getAgent } from '@/lib/lab-agents';

function serverClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = serverClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();

  // 1. 토너먼트
  const { data: tournament, error: tErr } = await admin
    .from('lab_tournaments')
    .select('*')
    .eq('id', id)
    .single();

  if (tErr || !tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  // 2. 팀 목록 + 에이전트 상세
  const { data: teams, error: teamErr } = await admin
    .from('lab_teams')
    .select('*')
    .eq('tournament_id', id)
    .order('seed', { ascending: true });

  if (teamErr) {
    return NextResponse.json({ error: teamErr.message }, { status: 500 });
  }

  const teamsWithAgents = (teams ?? []).map((team) => ({
    ...team,
    agents: (team.agent_ids as number[]).map((aid) => getAgent(aid)).filter(Boolean),
  }));

  // 3. 매치 목록
  const { data: matches, error: matchErr } = await admin
    .from('lab_matches')
    .select('*')
    .eq('tournament_id', id)
    .order('round', { ascending: true })
    .order('match_order', { ascending: true });

  if (matchErr) {
    return NextResponse.json({ error: matchErr.message }, { status: 500 });
  }

  // 4. 혁신 결과물
  const { data: innovations, error: innovErr } = await admin
    .from('lab_innovations')
    .select('*')
    .eq('tournament_id', id)
    .order('created_at', { ascending: true });

  if (innovErr) {
    return NextResponse.json({ error: innovErr.message }, { status: 500 });
  }

  return NextResponse.json({
    tournament,
    teams: teamsWithAgents,
    matches: matches ?? [],
    innovations: innovations ?? [],
  });
}
