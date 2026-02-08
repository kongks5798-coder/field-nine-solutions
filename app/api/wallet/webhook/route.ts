/**
 * K-UNIVERSAL Toss Payments Webhook Handler
 * Production-Grade webhook with HMAC-SHA256 verification
 *
 * Security Features:
 * - HMAC-SHA256 signature verification (REQUIRED)
 * - Idempotency handling (prevent duplicate processing)
 * - Structured audit logging
 * - Timing attack prevention
 *
 * @route POST /api/wallet/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getPaymentInfo } from '@/lib/toss/client';
import {
  webhookGuard,
  recordIdempotency,
  webhookSuccessResponse,
  webhookErrorResponse,
} from '@/lib/security/webhook-guard';
import { logger, auditLog } from '@/lib/logging/logger';

export const runtime = 'nodejs';

// ============================================
// Types
// ============================================

interface TossWebhookPayload {
  eventType: string;
  data: {
    paymentKey: string;
    orderId: string;
    status: string;
    method?: string;
    totalAmount?: number;
    approvedAt?: string;
  };
}

// ============================================
// Main Handler
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Use webhook guard for signature verification and idempotency
  const guard = await webhookGuard(request, {
    provider: 'toss',
    extractEventId: (payload) => {
      const p = payload as TossWebhookPayload;
      return p.data?.paymentKey || '';
    },
    extractEventType: (payload) => {
      const p = payload as TossWebhookPayload;
      return p.eventType || '';
    },
  });

  if (!guard.passed) {
    return guard.response!;
  }

  const { requestId, parsedBody, idempotencyKey } = guard;
  const payload = parsedBody as TossWebhookPayload;

  logger.info('toss_webhook_received', {
    requestId,
    eventType: payload.eventType,
    paymentKey: payload.data?.paymentKey,
  });

  try {
    switch (payload.eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        await handlePaymentStatusChanged(requestId, payload.data);
        break;

      case 'DEPOSIT_CALLBACK':
        await handleDepositCallback(requestId, payload.data);
        break;

      default:
        logger.info('toss_webhook_unhandled_event', {
          requestId,
          eventType: payload.eventType,
        });
    }

    // Record successful processing for idempotency
    if (idempotencyKey) {
      recordIdempotency(idempotencyKey, 'success');
    }

    auditLog({
      action: 'webhook_processed',
      actor: { ip: request.headers.get('x-forwarded-for') || 'unknown' },
      resource: { type: 'toss_payment', id: payload.data?.paymentKey },
      result: 'success',
      details: { eventType: payload.eventType },
    });

    return webhookSuccessResponse(requestId);
  } catch (error) {
    logger.error('toss_webhook_processing_error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      eventType: payload.eventType,
    });

    // Record failed processing
    if (idempotencyKey) {
      recordIdempotency(idempotencyKey, 'failed');
    }

    return webhookErrorResponse(
      'Webhook processing failed',
      requestId,
      500
    );
  }
}

// ============================================
// Event Handlers
// ============================================

interface PaymentStatusData {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount?: number;
}

async function handlePaymentStatusChanged(
  requestId: string,
  data: PaymentStatusData
): Promise<void> {
  const { paymentKey, orderId, status } = data;

  logger.info('toss_payment_status_changed', {
    requestId,
    paymentKey,
    orderId,
    status,
  });

  // Check if already processed (double-check beyond idempotency)
  const { data: existingTx } = await supabaseAdmin
    .from('transactions')
    .select('id, status')
    .eq('reference_id', paymentKey)
    .single();

  if (existingTx?.status === 'completed') {
    logger.info('toss_payment_already_completed', {
      requestId,
      paymentKey,
      transactionId: existingTx.id,
    });
    return;
  }

  switch (status) {
    case 'DONE':
      if (!existingTx) {
        const paymentInfo = await getPaymentInfo(paymentKey);
        if (paymentInfo) {
          logger.info('toss_webhook_completing_payment', {
            requestId,
            paymentKey,
            amount: paymentInfo.totalAmount,
          });
        }
      }
      break;

    case 'CANCELED':
    case 'PARTIAL_CANCELED':
      if (existingTx) {
        await supabaseAdmin
          .from('transactions')
          .update({
            status: 'cancelled',
            metadata: {
              cancelledAt: new Date().toISOString(),
              cancelledVia: 'webhook',
              webhookRequestId: requestId,
            },
          })
          .eq('reference_id', paymentKey);

        logger.info('toss_payment_cancelled', {
          requestId,
          paymentKey,
          transactionId: existingTx.id,
        });
      }
      break;

    case 'ABORTED':
    case 'EXPIRED':
      if (existingTx) {
        await supabaseAdmin
          .from('transactions')
          .update({
            status: 'failed',
            metadata: {
              failedAt: new Date().toISOString(),
              failReason: status,
              webhookRequestId: requestId,
            },
          })
          .eq('reference_id', paymentKey);

        logger.info('toss_payment_failed', {
          requestId,
          paymentKey,
          status,
          transactionId: existingTx.id,
        });
      }
      break;
  }
}

async function handleDepositCallback(
  requestId: string,
  data: PaymentStatusData
): Promise<void> {
  const { paymentKey, orderId, status } = data;

  logger.info('toss_deposit_callback', {
    requestId,
    paymentKey,
    orderId,
    status,
  });

  if (status !== 'DONE') {
    return;
  }

  // Find pending transaction
  const { data: pendingTx } = await supabaseAdmin
    .from('transactions')
    .select('id, wallet_id, user_id, amount')
    .eq('reference_id', paymentKey)
    .eq('status', 'pending')
    .single();

  if (!pendingTx) {
    logger.warn('toss_deposit_no_pending_transaction', {
      requestId,
      paymentKey,
    });
    return;
  }

  // Get current wallet balance
  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select('balance')
    .eq('id', pendingTx.wallet_id)
    .single();

  if (!wallet) {
    logger.error('toss_deposit_wallet_not_found', {
      requestId,
      walletId: pendingTx.wallet_id,
    });
    return;
  }

  const newBalance = Number(wallet.balance) + Number(pendingTx.amount);

  // Update wallet balance atomically
  const { error: walletError } = await supabaseAdmin
    .from('wallets')
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pendingTx.wallet_id);

  if (walletError) {
    logger.error('toss_deposit_wallet_update_failed', {
      requestId,
      walletId: pendingTx.wallet_id,
      error: walletError.message,
    });
    throw new Error('Failed to update wallet balance');
  }

  // Mark transaction as completed
  const { error: txError } = await supabaseAdmin
    .from('transactions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      metadata: {
        completedViaWebhook: true,
        webhookRequestId: requestId,
      },
    })
    .eq('id', pendingTx.id);

  if (txError) {
    logger.error('toss_deposit_transaction_update_failed', {
      requestId,
      transactionId: pendingTx.id,
      error: txError.message,
    });
    throw new Error('Failed to update transaction status');
  }

  logger.info('toss_deposit_completed', {
    requestId,
    paymentKey,
    transactionId: pendingTx.id,
    userId: pendingTx.user_id,
    amount: pendingTx.amount,
    newBalance,
  });

  auditLog({
    action: 'wallet_topup_completed',
    actor: { userId: pendingTx.user_id },
    resource: { type: 'wallet', id: pendingTx.wallet_id },
    result: 'success',
    details: {
      amount: pendingTx.amount,
      newBalance,
      paymentKey,
      via: 'toss_webhook',
    },
  });
}
