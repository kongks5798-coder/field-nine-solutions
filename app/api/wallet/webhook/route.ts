/**
 * K-UNIVERSAL Toss Payments Webhook Handler
 * 토스페이먼츠에서 결제 상태 변경 시 호출되는 웹훅
 *
 * Security:
 * - Secret key verification
 * - Idempotency handling
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { TOSS_SECRET_KEY, getPaymentInfo } from '@/lib/toss/client';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Webhook secret for signature verification
const WEBHOOK_SECRET = process.env.TOSS_WEBHOOK_SECRET || '';

// Audit log
function auditLog(action: string, data: Record<string, unknown>) {
  console.log(`[WEBHOOK][${new Date().toISOString()}][${action}]`, JSON.stringify(data));
}

/**
 * Verify Toss webhook signature
 */
function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    // In test mode, skip signature verification
    console.warn('[Webhook] No webhook secret configured, skipping verification');
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('base64');

  return signature === expectedSignature;
}

/**
 * POST /api/wallet/webhook
 * Handle Toss payment status webhooks
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = `webhook_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    const payload = await request.text();
    const signature = request.headers.get('toss-signature') || '';

    // Verify signature
    if (!verifySignature(payload, signature)) {
      auditLog('WEBHOOK_SIGNATURE_INVALID', { requestId });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const body = JSON.parse(payload);
    const { eventType, data } = body;

    auditLog('WEBHOOK_RECEIVED', {
      requestId,
      eventType,
      paymentKey: data?.paymentKey,
    });

    switch (eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        return await handlePaymentStatusChanged(requestId, data);

      case 'DEPOSIT_CALLBACK':
        return await handleDepositCallback(requestId, data);

      default:
        auditLog('WEBHOOK_UNKNOWN_EVENT', { requestId, eventType });
        return NextResponse.json({ received: true });
    }

  } catch (error) {
    auditLog('WEBHOOK_ERROR', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle payment status changed event
 */
async function handlePaymentStatusChanged(
  requestId: string,
  data: {
    paymentKey: string;
    orderId: string;
    status: string;
  }
): Promise<NextResponse> {
  const { paymentKey, orderId, status } = data;

  auditLog('PAYMENT_STATUS_CHANGED', { requestId, paymentKey, orderId, status });

  // Check if we already processed this payment
  const { data: existingTx } = await supabaseAdmin
    .from('transactions')
    .select('id, status')
    .eq('reference_id', paymentKey)
    .single();

  if (existingTx?.status === 'completed') {
    auditLog('PAYMENT_ALREADY_COMPLETED', { requestId, paymentKey });
    return NextResponse.json({ received: true, message: 'Already processed' });
  }

  // Handle different statuses
  switch (status) {
    case 'DONE':
      // Payment completed - if not already processed by success callback
      if (!existingTx) {
        // Get payment details from Toss
        const paymentInfo = await getPaymentInfo(paymentKey);
        if (paymentInfo) {
          auditLog('WEBHOOK_COMPLETING_PAYMENT', {
            requestId,
            paymentKey,
            amount: paymentInfo.totalAmount,
          });
          // Note: This is a backup - the success page should handle this
          // We just log it here for monitoring
        }
      }
      break;

    case 'CANCELED':
    case 'PARTIAL_CANCELED':
      // Update transaction status if exists
      if (existingTx) {
        await supabaseAdmin
          .from('transactions')
          .update({
            status: 'cancelled',
            metadata: {
              cancelledAt: new Date().toISOString(),
              reason: 'Cancelled via webhook'
            }
          })
          .eq('reference_id', paymentKey);

        auditLog('PAYMENT_CANCELLED_VIA_WEBHOOK', { requestId, paymentKey });
      }
      break;

    case 'ABORTED':
    case 'EXPIRED':
      // Mark as failed if exists
      if (existingTx) {
        await supabaseAdmin
          .from('transactions')
          .update({ status: 'failed' })
          .eq('reference_id', paymentKey);

        auditLog('PAYMENT_FAILED_VIA_WEBHOOK', { requestId, paymentKey, status });
      }
      break;
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle virtual account deposit callback
 */
async function handleDepositCallback(
  requestId: string,
  data: {
    paymentKey: string;
    orderId: string;
    status: string;
  }
): Promise<NextResponse> {
  const { paymentKey, orderId, status } = data;

  auditLog('DEPOSIT_CALLBACK', { requestId, paymentKey, orderId, status });

  if (status === 'DONE') {
    // Virtual account payment completed
    // Find the pending transaction and complete it
    const { data: pendingTx } = await supabaseAdmin
      .from('transactions')
      .select('id, wallet_id, user_id, amount')
      .eq('reference_id', paymentKey)
      .eq('status', 'pending')
      .single();

    if (pendingTx) {
      // Get current wallet balance
      const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('id', pendingTx.wallet_id)
        .single();

      if (wallet) {
        const newBalance = Number(wallet.balance) + Number(pendingTx.amount);

        // Update wallet balance
        await supabaseAdmin
          .from('wallets')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', pendingTx.wallet_id);

        // Update transaction status
        await supabaseAdmin
          .from('transactions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            metadata: {
              completedViaWebhook: true,
              webhookRequestId: requestId,
            }
          })
          .eq('id', pendingTx.id);

        auditLog('DEPOSIT_COMPLETED', {
          requestId,
          paymentKey,
          amount: pendingTx.amount,
          newBalance,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
