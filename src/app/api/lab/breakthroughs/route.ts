/**
 * GET /api/lab/breakthroughs — 4강/결승 진출 혁신 결과물 + KPI
 *
 * 인증된 사용자 접근 가능
 * 팀·토너먼트·에이전트·부모 혁신 상세 포함
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

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = serverClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();

  // KPI aggregates
  const { count: totalTournaments } = await admin
    .from('lab_tournaments')
    .select('*', { count: 'exact', head: true });

  const { count: totalInnovations } = await admin
    .from('lab_innovations')
    .select('*', { count: 'exact', head: true });

  const { count: breakthroughCount } = await admin
    .from('lab_innovations')
    .select('*', { count: 'exact', head: true })
    .in('round_reached', ['semi', 'final']);

  const { count: finalizedCount } = await admin
    .from('lab_innovations')
    .select('*', { count: 'exact', head: true })
    .eq('finalized', true);

  // 4강/결승 혁신 결과물 + 팀 + 토너먼트 시즌 + 부모 혁신
  const { data: innovations, error } = await admin
    .from('lab_innovations')
    .select(`
      *,
      team:lab_teams!lab_innovations_team_id_fkey(id, seed, agent_ids, team_name),
      tournament:lab_tournaments!lab_innovations_tournament_id_fkey(id, season, status),
      parent:lab_innovations!lab_innovations_parent_id_fkey(id, title)
    `)
    .in('round_reached', ['semi', 'final'])
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch breakthroughs" }, { status: 500 });
  }

  // 에이전트 상세 정보 첨부
  const breakthroughs = (innovations ?? []).map((innov) => {
    const team = innov.team as {
      id: string;
      seed: number;
      agent_ids: number[];
      team_name: string;
    } | null;

    const agents = team
      ? team.agent_ids.map((aid: number) => getAgent(aid)).filter(Boolean)
      : [];

    return {
      ...innov,
      agents,
    };
  });

  return NextResponse.json({
    kpi: {
      totalTournaments: totalTournaments ?? 0,
      totalInnovations: totalInnovations ?? 0,
      breakthroughCount: breakthroughCount ?? 0,
      finalizedCount: finalizedCount ?? 0,
    },
    breakthroughs,
  });
}
