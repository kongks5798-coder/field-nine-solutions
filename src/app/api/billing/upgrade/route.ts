import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { log } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { PLAN_PRICES } from '@/lib/plans';
import { SITE_URL } from '@/lib/constants';

// ─── Schema ───────────────────────────────────────────────────────────────────

const UpgradeSchema = z.object({
  targetPlan: z.enum(['pro', 'starter', 'free']),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeServerClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
}

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// 플랜 순서 (숫자가 클수록 상위 플랜)
const PLAN_RANK: Record<string, number> = {
  free:    0,
  starter: 0,
  pro:     1,
  team:    2,
};

// ─── POST /api/billing/upgrade ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // CSRF 체크
  const { verifyCsrf } = await import('@/lib/csrf');
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  // Rate limit: 유저당 1분에 5회
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = checkRateLimit(`billing_upgrade:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
  }

  // Auth
  const supabase = makeServerClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Body 파싱 & 검증
  const body = await req.json().catch(() => ({}));
  const parsed = UpgradeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'targetPlan은 pro, starter, free 중 하나여야 합니다.' }, { status: 400 });
  }
  const { targetPlan } = parsed.data;
  const uid = session.user.id;

  try {
    const admin = adminClient();

    // 현재 플랜 확인
    const { data: profile } = await admin
      .from('profiles')
      .select('plan, plan_expires_at, plan_pending_change')
      .eq('id', uid)
      .single();

    const currentPlan = (profile?.plan as string | undefined) ?? 'starter';
    const currentRank = PLAN_RANK[currentPlan] ?? 0;
    const targetRank  = PLAN_RANK[targetPlan]  ?? 0;

    // 동일 플랜 체크
    if (currentPlan === targetPlan || (targetPlan === 'free' && currentPlan === 'starter')) {
      return NextResponse.json({ error: '이미 해당 플랜을 사용 중입니다.' }, { status: 400 });
    }

    // ── 업그레이드 ─────────────────────────────────────────────────────────
    if (targetRank > currentRank) {
      // pro만 지원 (team은 향후 확장)
      if (targetPlan !== 'pro') {
        return NextResponse.json({ error: '업그레이드는 Pro 플랜만 지원됩니다.' }, { status: 400 });
      }

      const tossClientKey = process.env.TOSSPAYMENTS_CLIENT_KEY;
      if (!tossClientKey) {
        return NextResponse.json({ error: 'TossPayments 미설정 — 관리자에게 문의하세요.' }, { status: 503 });
      }

      const planInfo = PLAN_PRICES[targetPlan];
      const orderId = `upgrade_${uid.slice(0, 8)}_${Date.now()}`;

      log.billing('upgrade.checkout.created', { targetPlan, uid });

      return NextResponse.json({
        action: 'upgrade',
        provider: 'toss',
        clientKey: tossClientKey,
        orderId,
        amount: planInfo.discounted,
        orderName: `Dalkak ${targetPlan === 'pro' ? 'Pro' : 'Team'} 월구독`,
        customerEmail: session.user.email,
        customerName: session.user.user_metadata?.name || session.user.email,
        successUrl: `${SITE_URL}/api/billing/toss/confirm`,
        failUrl: `${SITE_URL}/pricing?canceled=1`,
        plan: targetPlan,
        userId: uid,
      });
    }

    // ── 다운그레이드 예약 ──────────────────────────────────────────────────
    if (targetRank < currentRank) {
      // 이미 다운그레이드 예약된 경우
      if (profile?.plan_pending_change) {
        return NextResponse.json({
          error: `이미 '${profile.plan_pending_change}' 플랜으로의 변경이 예약되어 있습니다.`,
        }, { status: 400 });
      }

      // plan_pending_change 컬럼에 저장 (즉시 적용 X — 기간 종료 후 적용)
      const { error: updateErr } = await admin
        .from('profiles')
        .update({
          plan_pending_change: targetPlan === 'free' ? 'starter' : targetPlan,
          updated_at: new Date().toISOString(),
        })
        .eq('id', uid);

      if (updateErr) {
        log.error('[upgrade] plan_pending_change 저장 실패', { error: updateErr.message, uid });
        return NextResponse.json({ error: '다운그레이드 예약 중 오류가 발생했습니다.' }, { status: 500 });
      }

      // 이벤트 로그 (billing_events 테이블 없을 경우 무시)
      try {
        await admin.from('billing_events').insert({
          user_id: uid,
          type: 'subscription_downgrade_scheduled',
          amount: 0,
          description: `${currentPlan} → ${targetPlan === 'free' ? 'starter' : targetPlan} 다운그레이드 예약 (현재 기간 종료 후 적용)`,
        });
      } catch {
        // billing_events 테이블 없어도 무시
      }

      log.info('[upgrade] 다운그레이드 예약 완료', { uid, from: currentPlan, to: targetPlan });

      const effectiveDate = profile?.plan_expires_at
        ? new Date(profile.plan_expires_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
        : '다음 청구 주기';

      return NextResponse.json({
        action: 'downgrade_scheduled',
        message: `현재 구독 기간(${effectiveDate}) 종료 후 무료 플랜으로 전환됩니다.`,
        effectiveDate,
      });
    }

    return NextResponse.json({ error: '플랜 변경 처리 중 오류가 발생했습니다.' }, { status: 400 });

  } catch (err) {
    log.error('[upgrade] 처리 실패', { error: (err as Error).message });
    return NextResponse.json({ error: '플랜 변경 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
