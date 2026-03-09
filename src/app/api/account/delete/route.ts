import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getAdminClient } from '@/lib/supabase-admin';
import { checkLimitRedis, ipFromHeaders, headersFor } from '@/core/rateLimitRedis';
import { z } from 'zod';

const BodySchema = z.object({
  confirm: z.string(),
});

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && url !== 'https://placeholder.supabase.co';
}

export async function POST(req: NextRequest) {
  // Rate limit: 2 attempts per hour per IP (abuse prevention)
  const ip = ipFromHeaders(req.headers);
  const rl = await checkLimitRedis(`account:delete:${ip}`, 2, 3_600_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'RATE_LIMIT', message: '요청이 너무 많습니다. 1시간 후 다시 시도해주세요.' },
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

  // Validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body schema' }, { status: 400 });
  }
  if (parsed.data.confirm !== 'DELETE') {
    return NextResponse.json(
      { error: 'CONFIRMATION_REQUIRED', message: '"DELETE"를 입력해야 계정을 삭제할 수 있습니다.' },
      { status: 422 }
    );
  }

  const uid = session.user.id;
  const userEmail = session.user.email ?? 'unknown';
  const admin = getAdminClient();

  // Log deletion BEFORE actually deleting (audit trail)
  await admin.from('audit_log').insert({
    user_id: uid,
    action: 'account_delete_initiated',
    metadata: { email: userEmail, initiated_at: new Date().toISOString() },
  }).maybeSingle(); // Non-fatal if audit_log table doesn't exist yet

  try {
    // Delete all user data in dependency order
    // 1. published_apps
    await admin.from('published_apps').delete().eq('user_id', uid);

    // 2. projects / workspace projects
    await admin.from('projects').delete().eq('user_id', uid);

    // 3. workspace_memory
    await admin.from('workspace_memory').delete().eq('user_id', uid);

    // 4. usage_records
    await admin.from('usage_records').delete().eq('user_id', uid);

    // 5. audit_log entries (delete after final log is written)
    await admin.from('audit_log').delete().eq('user_id', uid);

    // 6. profiles row
    await admin.from('profiles').delete().eq('id', uid);

    // 7. Delete auth user via Supabase Admin API
    const { error: deleteError } = await admin.auth.admin.deleteUser(uid);
    if (deleteError) {
      console.error('[account/delete] auth.admin.deleteUser failed:', deleteError);
      return NextResponse.json(
        { error: 'DELETE_FAILED', message: '계정 삭제 중 오류가 발생했습니다. 고객지원에 문의해주세요.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[account/delete] unexpected error:', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
