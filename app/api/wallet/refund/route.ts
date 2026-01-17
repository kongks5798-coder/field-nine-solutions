/**
 * K-UNIVERSAL Refund API
 * 결제 환불 엔드포인트
 *
 * Security:
 * - User authentication required
 * - Rate limiting applied
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cancelPayment, getPaymentInfo } from '@/lib/toss/client';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimiters,
  rateLimitHeaders,
} from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

// Audit log
function auditLog(action: string, data: Record<string, unknown>) {
  console.log(`[REFUND][${new Date().toISOString()}][${action}]`, JSON.stringify(data));
}

interface RefundRequest {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number; // Optional for partial refund
}

/**
 * POST /api/wallet/refund
 * Request a refund for a payment
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = `refund_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const clientIp = getClientIdentifier(request);

  // Rate limiting - use strict limiter for financial operations
  const rateLimit = checkRateLimit(clientIp, RateLimiters.strict);
  if (!rateLimit.allowed) {
    auditLog('RATE_LIMITED', { requestId, clientIp });
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: rateLimitHeaders(rateLimit) }
    );
  }

  try {
    // Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Read-only for this request
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      auditLog('AUTH_FAILED', { requestId });
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: RefundRequest = await request.json();
    const { paymentKey, cancelReason, cancelAmount } = body;

    // Validate input
    if (!paymentKey || !cancelReason) {
      auditLog('VALIDATION_FAILED', { requestId, userId: user.id });
      return NextResponse.json(
        { error: 'paymentKey and cancelReason are required' },
        { status: 400 }
      );
    }

    if (cancelReason.length < 5 || cancelReason.length > 200) {
      return NextResponse.json(
        { error: 'cancelReason must be between 5 and 200 characters' },
        { status: 400 }
      );
    }

    auditLog('REFUND_ATTEMPT', {
      requestId,
      userId: user.id,
      paymentKey,
      cancelAmount,
    });

    // Find the transaction in our database
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('id, wallet_id, user_id, amount, status, reference_id')
      .eq('reference_id', paymentKey)
      .single();

    if (txError || !transaction) {
      auditLog('TRANSACTION_NOT_FOUND', { requestId, paymentKey });
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (transaction.user_id !== user.id) {
      auditLog('UNAUTHORIZED_REFUND', {
        requestId,
        userId: user.id,
        transactionUserId: transaction.user_id,
      });
      return NextResponse.json(
        { error: 'You are not authorized to refund this transaction' },
        { status: 403 }
      );
    }

    // Check if already refunded
    if (transaction.status === 'refunded' || transaction.status === 'cancelled') {
      auditLog('ALREADY_REFUNDED', { requestId, paymentKey, status: transaction.status });
      return NextResponse.json(
        { error: 'Transaction has already been refunded or cancelled' },
        { status: 400 }
      );
    }

    // Check if eligible for refund (only completed transactions can be refunded)
    if (transaction.status !== 'completed') {
      auditLog('NOT_ELIGIBLE', { requestId, paymentKey, status: transaction.status });
      return NextResponse.json(
        { error: `Transaction with status '${transaction.status}' cannot be refunded` },
        { status: 400 }
      );
    }

    // Verify with Toss
    const paymentInfo = await getPaymentInfo(paymentKey);
    if (!paymentInfo) {
      auditLog('TOSS_PAYMENT_NOT_FOUND', { requestId, paymentKey });
      return NextResponse.json(
        { error: 'Payment not found in payment provider' },
        { status: 404 }
      );
    }

    // Check if Toss payment is in refundable state
    if (paymentInfo.status !== 'DONE') {
      auditLog('TOSS_NOT_REFUNDABLE', { requestId, paymentKey, status: paymentInfo.status });
      return NextResponse.json(
        { error: `Payment with status '${paymentInfo.status}' cannot be refunded` },
        { status: 400 }
      );
    }

    // Determine refund amount
    const refundAmount = cancelAmount || transaction.amount;

    if (refundAmount > transaction.amount) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed original transaction amount' },
        { status: 400 }
      );
    }

    // Call Toss cancel API
    const cancelResult = await cancelPayment(paymentKey, cancelReason);

    if (!cancelResult.success) {
      auditLog('TOSS_CANCEL_FAILED', {
        requestId,
        paymentKey,
        error: cancelResult.error,
      });
      return NextResponse.json(
        { error: cancelResult.error || 'Failed to process refund' },
        { status: 500 }
      );
    }

    // Update transaction status in database
    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({
        status: refundAmount === transaction.amount ? 'refunded' : 'partial_refunded',
        metadata: {
          refundedAt: new Date().toISOString(),
          refundReason: cancelReason,
          refundAmount,
          refundRequestId: requestId,
        },
      })
      .eq('id', transaction.id);

    if (updateError) {
      // Log but don't fail - Toss refund already succeeded
      auditLog('DB_UPDATE_FAILED', {
        requestId,
        paymentKey,
        error: updateError.message,
      });
    }

    // Update wallet balance (deduct refund amount)
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('id', transaction.wallet_id)
      .single();

    if (wallet) {
      const newBalance = Math.max(0, Number(wallet.balance) - refundAmount);

      await supabaseAdmin
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.wallet_id);

      auditLog('WALLET_BALANCE_UPDATED', {
        requestId,
        walletId: transaction.wallet_id,
        oldBalance: wallet.balance,
        newBalance,
        refundAmount,
      });
    }

    auditLog('REFUND_SUCCESS', {
      requestId,
      paymentKey,
      refundAmount,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      refundAmount,
      paymentKey,
    });

  } catch (error) {
    auditLog('REFUND_ERROR', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
