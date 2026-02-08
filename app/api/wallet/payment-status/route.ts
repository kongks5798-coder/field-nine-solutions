/**
 * K-UNIVERSAL Payment Status API
 * 결제 상태 조회 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentInfo } from '@/lib/toss/client';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimiters,
  rateLimitHeaders,
} from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

/**
 * GET /api/wallet/payment-status?paymentKey=xxx
 * Get payment status from Toss and local database
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIdentifier(request);

  // Rate limiting
  const rateLimit = checkRateLimit(clientIp, RateLimiters.standard);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: rateLimitHeaders(rateLimit) }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');

    if (!paymentKey && !orderId) {
      return NextResponse.json(
        { error: 'paymentKey or orderId is required' },
        { status: 400 }
      );
    }

    // Check local database first
    let dbQuery = supabaseAdmin
      .from('transactions')
      .select('id, status, amount, created_at, completed_at, metadata');

    if (paymentKey) {
      dbQuery = dbQuery.eq('reference_id', paymentKey);
    } else if (orderId) {
      dbQuery = dbQuery.eq('metadata->>orderId', orderId);
    }

    const { data: localTx } = await dbQuery.single();

    // If we have a local record
    if (localTx) {
      return NextResponse.json({
        success: true,
        source: 'database',
        status: localTx.status,
        amount: localTx.amount,
        createdAt: localTx.created_at,
        completedAt: localTx.completed_at,
      });
    }

    // If paymentKey provided, check Toss directly
    if (paymentKey) {
      const tossPayment = await getPaymentInfo(paymentKey);

      if (tossPayment) {
        return NextResponse.json({
          success: true,
          source: 'toss',
          status: tossPayment.status,
          amount: tossPayment.totalAmount,
          method: tossPayment.method,
          approvedAt: tossPayment.approvedAt,
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Payment not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('[Payment Status API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get payment status' },
      { status: 500 }
    );
  }
}
