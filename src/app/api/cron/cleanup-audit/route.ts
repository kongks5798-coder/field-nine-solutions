/**
 * GET /api/cron/cleanup-audit
 * Vercel Cron: 매일 03:00 UTC에 90일 이상 된 audit_log 삭제
 * (Migration 097의 pg_cron 대체 — Vercel 환경에서 자동 실행)
 * vercel.json에 cron 스케줄 등록 필요: "0 3 * * *"
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Cron secret 검증 — CRON_SECRET 필수 (미설정 시 503)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
  }
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (token !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const admin = getAdminClient();
    const { count, error } = await admin
      .from('audit_log')
      .delete({ count: 'exact' })
      .lt('created_at', cutoff);

    if (error) {
      log.error('[cron/cleanup-audit] 삭제 실패', { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    log.info('[cron/cleanup-audit] 완료', { deleted: count, cutoff });
    return NextResponse.json({ ok: true, deleted: count ?? 0, cutoff });
  } catch (err) {
    log.error('[cron/cleanup-audit] 예외', { error: (err as Error).message });
    return NextResponse.json({ error: '내부 오류' }, { status: 500 });
  }
}
