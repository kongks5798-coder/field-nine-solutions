import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { log } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';

const ForkSchema = z.object({ slug: z.string().min(1).max(100) });

export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit: 5 forks per minute per user
  const rateLimitKey = `fork:${session.user.id}`;
  const rl = checkRateLimit(rateLimitKey, { limit: 5, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요 (분당 5회 제한)' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = ForkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: '슬러그가 필요합니다.' }, { status: 400 });

  const { slug } = parsed.data;

  try {
    // 원본 앱 조회
    const { createServerClient: adminClient } = await import('@supabase/ssr');
    const admin = adminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { data: app, error: appErr } = await admin
      .from('published_apps')
      .select('name, html')
      .eq('slug', slug)
      .single();

    if (appErr || !app) return NextResponse.json({ error: '앱을 찾을 수 없습니다.' }, { status: 404 });

    // 새 프로젝트로 저장
    const forkedName = `${app.name} (포크)`;
    const { data: project, error: projErr } = await admin
      .from('projects')
      .insert({
        user_id: session.user.id,
        name: forkedName,
        files: { 'index.html': { name: 'index.html', language: 'html', content: app.html } },
        forked_from: slug,
      })
      .select('id')
      .single();

    if (projErr || !project) {
      log.error('[fork] 프로젝트 생성 실패', { error: projErr?.message });
      return NextResponse.json({ error: '포크 생성에 실패했습니다.' }, { status: 500 });
    }

    // Increment fork count (best-effort, ignore errors)
    admin.rpc('increment_forks', { slug_param: slug }).then(() => {});

    log.info('[fork] 포크 완료', { slug, projectId: project.id, userId: session.user.id });
    return NextResponse.json({ projectId: project.id, name: forkedName, redirect: `/workspace?project=${project.id}` });
  } catch (err) {
    log.error('[fork] 처리 실패', { error: (err as Error).message });
    return NextResponse.json({ error: '포크 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
