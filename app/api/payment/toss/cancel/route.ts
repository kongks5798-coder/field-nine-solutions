/**
 * Toss Payments Cancel API
 * POST /api/payment/toss/cancel
 *
 * STATUS: DISABLED - Toss payments will be enabled after revenue milestone
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Toss 결제는 현재 준비 중입니다. PayPal을 이용해 주세요.',
      code: 'TOSS_DISABLED',
      availableProviders: ['paypal'],
    },
    { status: 503 }
  );
}
