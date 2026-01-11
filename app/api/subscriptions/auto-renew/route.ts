import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/utils/supabase/server';
import { formatErrorResponse, logError } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 구독 자동 갱신 크론 작업
 * POST /api/subscriptions/auto-renew
 * 
 * 만료 예정인 구독을 자동으로 갱신
 * Vercel Cron 또는 외부 스케줄러에서 호출
 */

export async function POST(request: NextRequest) {
  try {
    // 인증: 서버 사이드에서만 호출 가능 (Secret 키 확인)
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;
    
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // 만료 예정인 구독 조회 (3일 이내 만료)
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const { data: expiringSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .eq('auto_renew', true)
      .lte('expires_at', threeDaysLater.toISOString())
      .gte('expires_at', new Date().toISOString());

    if (fetchError) {
      logError(fetchError, { action: 'fetch_expiring_subscriptions' });
      return NextResponse.json(
        { success: false, error: '구독 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: '갱신할 구독이 없습니다.',
        renewed: 0,
      });
    }

    // 각 구독 갱신 처리
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const subscription of expiringSubscriptions) {
      try {
        // 만료일 계산
        const expiresAt = subscription.expires_at 
          ? new Date(subscription.expires_at)
          : new Date();
        
        // 갱신 기간 추가
        const renewalPeriod = subscription.billing_cycle === 'yearly' ? 365 : 30;
        expiresAt.setDate(expiresAt.getDate() + renewalPeriod);

        // 구독 갱신
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

        if (updateError) {
          throw updateError;
        }

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`구독 ${subscription.id}: ${error.message}`);
        logError(error, { subscriptionId: subscription.id });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.success}개 구독이 갱신되었습니다.`,
      renewed: results.success,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error: unknown) {
    logError(error, { action: 'auto_renew_subscriptions' });
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.message,
        code: errorResponse.code,
      },
      { status: errorResponse.statusCode }
    );
  }
}
