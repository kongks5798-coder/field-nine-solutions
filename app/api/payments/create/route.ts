import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/src/utils/supabase/server';
import { formatErrorResponse, logError, AppError, ErrorCodes } from '@/lib/error-handler';
import { validateAmount, validatePlanId, validateBillingCycle } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 결제 생성 API
 * Toss Payments 결제 요청 생성
 * POST /api/payments/create
 */

interface PaymentRequest {
  planId: string;
  planName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  successUrl: string;
  failUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    // 인증 체크
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body: PaymentRequest = await request.json();
    const { planId, planName, amount, billingCycle, successUrl, failUrl } = body;

    // 입력 검증
    const planIdValidation = validatePlanId(planId);
    if (!planIdValidation.valid) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, planIdValidation.errors?.join(', ') || 'Invalid plan ID', 400);
    }

    const amountValidation = validateAmount(amount);
    if (!amountValidation.valid) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, amountValidation.errors?.join(', ') || 'Invalid amount', 400);
    }

    const billingCycleValidation = validateBillingCycle(billingCycle);
    if (!billingCycleValidation.valid) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, billingCycleValidation.errors?.join(', ') || 'Invalid billing cycle', 400);
    }

    if (!planName || typeof planName !== 'string') {
      throw new AppError(ErrorCodes.MISSING_REQUIRED_FIELD, '플랜 이름이 필요합니다.', 400);
    }

    const supabase = await createClient();

    // 구독 정보 생성 (결제 전 대기 상태)
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        plan_name: planName,
        billing_cycle: billingCycle,
        amount: amount,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (subError || !subscription) {
      console.error('[Payment Create] 구독 생성 오류:', subError);
      return NextResponse.json(
        { success: false, error: '구독 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Toss Payments 결제 요청 생성
    const tossClientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY;
    const tossSecretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;

    if (!tossClientKey || !tossSecretKey) {
      throw new AppError(
        ErrorCodes.EXTERNAL_SERVICE_ERROR,
        'Toss Payments 키가 설정되지 않았습니다.',
        500
      );
    }

    // Toss Payments는 클라이언트 사이드에서 위젯을 통해 결제를 진행
    // 서버에서는 구독 정보만 생성하고 클라이언트 키를 반환
    // 실제 결제는 클라이언트에서 Toss Payments Widget으로 처리
    
    const orderId = `subscription-${subscription.id}-${Date.now()}`;
    
    // 구독에 orderId 저장
    await supabase
      .from('subscriptions')
      .update({
        payment_id: orderId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      orderId: orderId,
      amount: amount,
      planName: planName,
      clientKey: tossClientKey, // 클라이언트에서 위젯 초기화에 사용
      // 클라이언트에서 Toss Payments Widget을 사용하여 결제 진행
      // 결제 완료 후 웹훅으로 처리
    });
  } catch (error: unknown) {
    let planIdForLog = 'unknown';
    try {
      const errorBody = await request.json().catch(() => ({}));
      planIdForLog = (errorBody as any)?.planId || 'unknown';
    } catch {
      // JSON 파싱 실패 시 무시
    }
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logError(errorObj, { action: 'create_payment', planId: planIdForLog });
    const errorResponse = formatErrorResponse(errorObj);
    const statusCode = errorObj instanceof AppError ? errorObj.statusCode : 500;
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.error,
        code: errorResponse.code,
      },
      { status: statusCode }
    );
  }
}
