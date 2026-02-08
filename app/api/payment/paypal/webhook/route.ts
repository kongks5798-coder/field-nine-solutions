/**
 * K-UNIVERSAL PayPal Webhook Handler
 * Production-Grade webhook with signature verification
 *
 * Security Features:
 * - PayPal API signature verification (REQUIRED)
 * - Idempotency handling (prevent duplicate processing)
 * - Structured audit logging
 * - Replay attack prevention (timestamp validation)
 *
 * @route POST /api/payment/paypal/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  webhookGuard,
  recordIdempotency,
  webhookSuccessResponse,
  webhookErrorResponse,
} from '@/lib/security/webhook-guard';
import { logger, auditLog } from '@/lib/logging/logger';
import {
  notifyPaymentSuccess,
  notifyPaymentFailed,
  notifyPaymentRefund,
  sendPaymentNotification,
} from '@/lib/notifications/payment-alerts';

export const runtime = 'nodejs';

// ============================================
// Types
// ============================================

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  resource_version: string;
  summary: string;
  resource: {
    id: string;
    status?: string;
    amount?: {
      currency_code: string;
      value: string;
    };
    custom_id?: string;
    invoice_id?: string;
    payer?: {
      email_address?: string;
      payer_id?: string;
      name?: {
        given_name?: string;
        surname?: string;
      };
    };
    purchase_units?: Array<{
      reference_id?: string;
      custom_id?: string;
      amount?: {
        currency_code: string;
        value: string;
      };
    }>;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  };
  links?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

// ============================================
// Main Handler
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const guard = await webhookGuard(request, {
    provider: 'paypal',
    extractEventId: (payload) => {
      const p = payload as PayPalWebhookEvent;
      return p.id || '';
    },
    extractEventType: (payload) => {
      const p = payload as PayPalWebhookEvent;
      return p.event_type || '';
    },
  });

  if (!guard.passed) {
    return guard.response!;
  }

  const { requestId, parsedBody, idempotencyKey } = guard;
  const event = parsedBody as PayPalWebhookEvent;

  logger.info('paypal_webhook_received', {
    requestId,
    eventType: event.event_type,
    eventId: event.id,
    resourceId: event.resource?.id,
  });

  try {
    // Handle different event types
    switch (event.event_type) {
      // Payment Capture Events
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(requestId, event);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentCaptureDenied(requestId, event);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentCaptureRefunded(requestId, event);
        break;

      // Checkout Order Events
      case 'CHECKOUT.ORDER.APPROVED':
        await handleCheckoutOrderApproved(requestId, event);
        break;

      case 'CHECKOUT.ORDER.COMPLETED':
        await handleCheckoutOrderCompleted(requestId, event);
        break;

      // Payment Sale Events (for subscriptions)
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentSaleCompleted(requestId, event);
        break;

      case 'PAYMENT.SALE.DENIED':
        await handlePaymentSaleDenied(requestId, event);
        break;

      case 'PAYMENT.SALE.REFUNDED':
        await handlePaymentSaleRefunded(requestId, event);
        break;

      // Dispute Events
      case 'CUSTOMER.DISPUTE.CREATED':
        await handleDisputeCreated(requestId, event);
        break;

      case 'CUSTOMER.DISPUTE.RESOLVED':
        await handleDisputeResolved(requestId, event);
        break;

      default:
        logger.info('paypal_webhook_unhandled_event', {
          requestId,
          eventType: event.event_type,
        });
    }

    if (idempotencyKey) {
      recordIdempotency(idempotencyKey, 'success');
    }

    auditLog({
      action: 'paypal_webhook_processed',
      actor: { ip: request.headers.get('x-forwarded-for') || 'unknown' },
      resource: { type: 'paypal_payment', id: event.resource?.id },
      result: 'success',
      details: { eventType: event.event_type },
    });

    return webhookSuccessResponse(requestId);
  } catch (error) {
    logger.error('paypal_webhook_processing_error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      eventType: event.event_type,
    });

    if (idempotencyKey) {
      recordIdempotency(idempotencyKey, 'failed');
    }

    return webhookErrorResponse('Webhook processing failed', requestId, 500);
  }
}

// ============================================
// Event Handlers
// ============================================

async function handlePaymentCaptureCompleted(
  requestId: string,
  event: PayPalWebhookEvent
): Promise<void> {
  const resource = event.resource;
  const captureId = resource.id;
  const amount = resource.amount;
  const customId = resource.custom_id;

  logger.info('paypal_payment_capture_completed', {
    requestId,
    captureId,
    amount: amount?.value,
    currency: amount?.currency_code,
    customId,
  });

  if (!customId) {
    logger.warn('paypal_webhook_no_custom_id', { requestId, captureId });
    return;
  }

  // Find transaction by reference
  const { data: transaction } = await supabaseAdmin
    .from('transactions')
    .select('id, user_id, wallet_id, amount, status')
    .eq('reference_id', customId)
    .single();

  if (!transaction) {
    logger.warn('paypal_webhook_transaction_not_found', {
      requestId,
      customId,
    });
    return;
  }

  if (transaction.status === 'completed') {
    logger.info('paypal_transaction_already_completed', {
      requestId,
      transactionId: transaction.id,
    });
    return;
  }

  // Update transaction status
  const { error: txError } = await supabaseAdmin
    .from('transactions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      metadata: {
        paypalCaptureId: captureId,
        completedViaWebhook: true,
        webhookRequestId: requestId,
      },
    })
    .eq('id', transaction.id);

  if (txError) {
    logger.error('paypal_transaction_update_failed', {
      requestId,
      transactionId: transaction.id,
      error: txError.message,
    });
    throw txError;
  }

  // Update wallet balance if applicable
  if (transaction.wallet_id) {
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('id', transaction.wallet_id)
      .single();

    if (wallet) {
      const newBalance = Number(wallet.balance) + Number(transaction.amount);

      await supabaseAdmin
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.wallet_id);

      logger.info('paypal_wallet_balance_updated', {
        requestId,
        walletId: transaction.wallet_id,
        previousBalance: wallet.balance,
        newBalance,
      });
    }
  }

  auditLog({
    action: 'payment_completed',
    actor: { userId: transaction.user_id },
    resource: { type: 'transaction', id: transaction.id },
    result: 'success',
    details: {
      provider: 'paypal',
      captureId,
      amount: amount?.value,
    },
  });

  // 결제 성공 알림 전송 (Slack, Email, Kakao)
  await notifyPaymentSuccess('paypal', Number(amount?.value || 0), amount?.currency_code || 'USD', {
    orderId: customId,
    paymentId: captureId,
  });
}

async function handlePaymentCaptureDenied(
  requestId: string,
  event: PayPalWebhookEvent
): Promise<void> {
  const resource = event.resource;
  const customId = resource.custom_id;
  const amount = resource.amount;

  logger.warn('paypal_payment_capture_denied', {
    requestId,
    captureId: resource.id,
    customId,
  });

  if (!customId) return;

  const { error } = await supabaseAdmin
    .from('transactions')
    .update({
      status: 'failed',
      metadata: {
        failReason: 'Payment capture denied',
        paypalCaptureId: resource.id,
        webhookRequestId: requestId,
      },
    })
    .eq('reference_id', customId);

  if (error) {
    logger.error('paypal_transaction_status_update_failed', {
      requestId,
      customId,
      error: error.message,
    });
  }

  // 결제 실패 알림 전송
  await notifyPaymentFailed('paypal', Number(amount?.value || 0), amount?.currency_code || 'USD', {
    orderId: customId,
    error: 'Payment capture denied by PayPal',
  });
}

async function handlePaymentCaptureRefunded(
  requestId: string,
  event: PayPalWebhookEvent
): Promise<void> {
  const resource = event.resource;
  const customId = resource.custom_id;
  const amount = resource.amount;

  logger.info('paypal_payment_capture_refunded', {
    requestId,
    captureId: resource.id,
    customId,
  });

  if (!customId) return;

  const { error } = await supabaseAdmin
    .from('transactions')
    .update({
      status: 'refunded',
      metadata: {
        refundedAt: new Date().toISOString(),
        paypalCaptureId: resource.id,
        webhookRequestId: requestId,
      },
    })
    .eq('reference_id', customId);

  if (error) {
    logger.error('paypal_refund_status_update_failed', {
      requestId,
      customId,
      error: error.message,
    });
  }

  // 환불 알림 전송
  await notifyPaymentRefund('paypal', Number(amount?.value || 0), amount?.currency_code || 'USD', {
    orderId: customId,
    reason: 'Customer refund processed',
  });
}

async function handleCheckoutOrderApproved(
  requestId: string,
  event: PayPalWebhookEvent
): Promise<void> {
  logger.info('paypal_checkout_order_approved', {
    requestId,
    orderId: event.resource.id,
    status: event.resource.status,
  });

  // Order approved - capture will be triggered from frontend
}

async function handleCheckoutOrderCompleted(
  requestId: string,
  event: PayPalWebhookEvent
): Promise<void> {
  const resource = event.resource;
  const purchaseUnit = resource.purchase_units?.[0];
  const capture = resource.payments?.captures?.[0];

  logger.info('paypal_checkout_order_completed', {
    requestId,
    orderId: resource.id,
    captureId: capture?.id,
    amount: capture?.amount?.value,
  });

  const customId = purchaseUnit?.custom_id || purchaseUnit?.reference_id;

  if (!customId) {
    logger.warn('paypal_order_no_reference', { requestId, orderId: resource.id });
    return;
  }

  // Update booking status if this is a booking payment
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, status')
    .eq('payment_reference', customId)
    .single();

  if (booking && booking.status === 'pending_payment') {
    await supabaseAdmin
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        payment_completed_at: new Date().toISOString(),
        metadata: {
          paypalOrderId: resource.id,
          paypalCaptureId: capture?.id,
        },
      })
      .eq('id', booking.id);

    logger.info('paypal_booking_confirmed', {
      requestId,
      bookingId: booking.id,
      orderId: resource.id,
    });

    // 예약 결제 성공 알림 전송
    await notifyPaymentSuccess('paypal', Number(capture?.amount?.value || 0), capture?.amount?.currency_code || 'USD', {
      bookingId: booking.id,
      orderId: resource.id,
      paymentId: capture?.id,
    });
  }
}

async function handlePaymentSaleCompleted(
  requestId: string,
  event: PayPalWebhookEvent
): Promise<void> {
  logger.info('paypal_payment_sale_completed', {
    requestId,
    saleId: event.resource.id,
    amount: event.resource.amount?.value,
  });
}

async function handlePaymentSaleDenied(
  requestId: string,
  event: PayPalWebhookEvent
): Promise<void> {
  logger.warn('paypal_payment_sale_denied', {
    requestId,
    saleId: event.resource.id,
  });
}

async function handlePaymentSaleRefunded(
  requestId: string,
  event: PayPalWebhookEvent
): Promise<void> {
  logger.info('paypal_payment_sale_refunded', {
    requestId,
    saleId: event.resource.id,
  });
}

async function handleDisputeCreated(
  requestId: string,
  event: PayPalWebhookEvent
): Promise<void> {
  logger.error('paypal_dispute_created', {
    requestId,
    disputeId: event.resource.id,
    summary: event.summary,
  });

  // Alert admin about the dispute
  auditLog({
    action: 'payment_dispute_created',
    actor: { ip: 'paypal-webhook' },
    resource: { type: 'dispute', id: event.resource.id },
    result: 'failure',
    details: {
      summary: event.summary,
      requiresAttention: true,
    },
  });

  // 분쟁 알림 전송 (긴급)
  await sendPaymentNotification({
    type: 'dispute',
    provider: 'paypal',
    amount: Number(event.resource.amount?.value || 0),
    currency: event.resource.amount?.currency_code || 'USD',
    orderId: event.resource.id,
    timestamp: new Date(),
    metadata: {
      summary: event.summary,
      disputeId: event.resource.id,
      requiresImmediateAttention: true,
    },
  });
}

async function handleDisputeResolved(
  requestId: string,
  event: PayPalWebhookEvent
): Promise<void> {
  logger.info('paypal_dispute_resolved', {
    requestId,
    disputeId: event.resource.id,
    status: event.resource.status,
  });
}
