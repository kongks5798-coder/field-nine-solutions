import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getAdminClient } from '@/lib/supabase-admin';
import { checkLimitRedis, ipFromHeaders, headersFor } from '@/core/rateLimitRedis';

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && url !== 'https://placeholder.supabase.co';
}

export async function GET(req: NextRequest) {
  // Rate limit: 5 requests per day per user/IP (GDPR export is expensive)
  const ip = ipFromHeaders(req.headers);
  const rl = await checkLimitRedis(`account:export:${ip}`, 5, 86_400_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'RATE_LIMIT', message: '하루 최대 5회 내보낼 수 있습니다. 내일 다시 시도해주세요.' },
      { status: 429, headers: headersFor(rl) }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  // Verify user session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uid = session.user.id;
  const admin = getAdminClient();

  try {
    // Collect all user data in parallel
    const [profileRes, appsRes, projectsRes, usageRes, memoryRes] = await Promise.all([
      admin
        .from('profiles')
        .select('id, email, username, plan, created_at, updated_at')
        .eq('id', uid)
        .single(),
      admin
        .from('published_apps')
        .select('id, name, slug, description, created_at, updated_at, views, likes')
        .eq('user_id', uid)
        .order('created_at', { ascending: false }),
      admin
        .from('projects')
        .select('id, name, created_at, updated_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false }),
      admin
        .from('usage_records')
        .select('id, type, amount, created_at, metadata')
        .eq('user_id', uid)
        .order('created_at', { ascending: false }),
      admin
        .from('workspace_memory')
        .select('id, key, created_at, updated_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false }),
    ]);

    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        format_version: '1.0',
        gdpr_article: 'Article 20 — Right to data portability',
        service: 'Dalkak / FieldNine',
      },
      profile: profileRes.data ?? null,
      published_apps: appsRes.data ?? [],
      projects: projectsRes.data ?? [],
      usage_records: usageRes.data ?? [],
      workspace_memory_keys: memoryRes.data ?? [],
    };

    const json = JSON.stringify(exportData, null, 2);
    const today = new Date().toISOString().split('T')[0];
    const filename = `dalkak-data-export-${today}.json`;

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[account/export] unexpected error:', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '데이터 내보내기 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
