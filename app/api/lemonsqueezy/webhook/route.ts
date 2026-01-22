/**
 * K-UNIVERSAL LemonSqueezy Webhook Handler
 * Production-Grade subscription webhook with HMAC-SHA256 verification
 *
 * Security Features:
 * - HMAC-SHA256 signature verification (REQUIRED)
 * - Idempotency handling (prevent duplicate processing)
 * - Structured audit logging
 * - Timing attack prevention
 *
 * @route POST /api/lemonsqueezy/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getPlanIdFromVariant } from '@/lib/lemonsqueezy/client';
import { SUBSCRIPTION_PLANS } from '@/lib/config/brand';
import { sendPaymentFailedEmail, sendSubscriptionCancelledEmail } from '@/lib/email/notifications';
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

type WebhookEvent =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'subscription_paused'
  | 'subscription_unpaused'
  | 'subscription_payment_success'
  | 'subscription_payment_failed'
  | 'order_created';

interface WebhookPayload {
  meta: {
    event_name: WebhookEvent;
    custom_data?: {
      user_id?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      status?: string;
      variant_name?: string;
      current_period_start?: string;
      renews_at?: string;
      cancelled?: boolean;
      [key: string]: unknown;
    };
    relationships?: {
      customer?: {
        data?: {
          id: string;
        };
      };
      variant?: {
        data?: {
          id: string;
        };
      };
    };
  };
}

// ============================================
// Main Handler
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const guard = await webhookGuard(request, {
    provider: 'lemonsqueezy',
    extractEventId: (payload) => {
      const p = payload as WebhookPayload;
      return p.data?.id || '';
    },
    extractEventType: (payload) => {
      const p = payload as WebhookPayload;
      return p.meta?.event_name || '';
    },
  });

  if (!guard.passed) {
    return guard.response!;
  }

  const { requestId, parsedBody, idempotencyKey } = guard;
  const payload = parsedBody as WebhookPayload;
  const eventName = payload.meta.event_name;

  logger.info('lemonsqueezy_webhook_received', {
    requestId,
    eventName,
    subscriptionId: payload.data?.id,
    userId: payload.meta.custom_data?.user_id,
  });

  try {
    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
      case 'subscription_resumed':
      case 'subscription_unpaused':
        await handleSubscriptionActive(requestId, payload);
        break;

      case 'subscription_cancelled':
      case 'subscription_expired':
        await handleSubscriptionEnded(requestId, payload);
        break;

      case 'subscription_paused':
        await handleSubscriptionPaused(requestId, payload);
        break;

      case 'subscription_payment_success':
        await handlePaymentSuccess(requestId, payload);
        break;

      case 'subscription_payment_failed':
        await handlePaymentFailed(requestId, payload);
        break;

      case 'order_created':
        await handleOrderCreated(requestId, payload);
        break;

      default:
        logger.info('lemonsqueezy_webhook_unhandled_event', {
          requestId,
          eventName,
        });
    }

    if (idempotencyKey) {
      recordIdempotency(idempotencyKey, 'success');
    }

    auditLog({
      action: 'subscription_webhook_processed',
      actor: { userId: payload.meta.custom_data?.user_id },
      resource: { type: 'subscription', id: payload.data?.id },
      result: 'success',
      details: { eventName },
    });

    return webhookSuccessResponse(requestId);
  } catch (error) {
    logger.error('lemonsqueezy_webhook_processing_error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      eventName,
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

async function handleSubscriptionActive(
  requestId: string,
  payload: WebhookPayload
): Promise<void> {
  const attrs = payload.data.attributes;
  const userId = payload.meta.custom_data?.user_id;
  const customerId = payload.data.relationships?.customer?.data?.id;
  const variantId = payload.data.relationships?.variant?.data?.id || '';
  const subscriptionId = payload.data.id;

  if (!userId) {
    logger.warn('lemonsqueezy_webhook_no_user_id', {
      requestId,
      subscriptionId,
    });
    return;
  }

  const planId = getPlanIdFromVariant(variantId);
  const plan = SUBSCRIPTION_PLANS[planId];

  const statusMap: Record<string, string> = {
    on_trial: 'trialing',
    active: 'active',
    paused: 'paused',
    past_due: 'past_due',
    unpaid: 'past_due',
    cancelled: 'canceled',
    expired: 'canceled',
  };

  const status = statusMap[attrs.status as string] || 'active';
  const billingCycle = (attrs.variant_name as string)?.toLowerCase().includes('year')
    ? 'yearly'
    : 'monthly';

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      lemonsqueezy_subscription_id: subscriptionId,
      lemonsqueezy_customer_id: customerId,
      plan_id: planId,
      status,
      billing_cycle: billingCycle,
      current_period_start: attrs.current_period_start
        ? new Date(attrs.current_period_start).toISOString()
        : null,
      current_period_end: attrs.renews_at
        ? new Date(attrs.renews_at).toISOString()
        : null,
      cancel_at_period_end: attrs.cancelled || false,
      ai_chats_limit: plan.features.aiChats,
      esim_data_limit_mb: plan.features.esimData === -1 ? -1 : plan.features.esimData * 1024,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    logger.error('lemonsqueezy_subscription_update_failed', {
      requestId,
      userId,
      error: error.message,
    });
    throw error;
  }

  logger.info('lemonsqueezy_subscription_activated', {
    requestId,
    userId,
    planId,
    status,
  });
}

async function handleSubscriptionEnded(
  requestId: string,
  payload: WebhookPayload
): Promise<void> {
  const userId = payload.meta.custom_data?.user_id;

  if (!userId) {
    logger.warn('lemonsqueezy_webhook_no_user_id', { requestId });
    return;
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      plan_id: 'free',
      status: 'active',
      lemonsqueezy_subscription_id: null,
      billing_cycle: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
      ai_chats_limit: SUBSCRIPTION_PLANS.free.features.aiChats,
      esim_data_limit_mb: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    logger.error('lemonsqueezy_subscription_downgrade_failed', {
      requestId,
      userId,
      error: error.message,
    });
    throw error;
  }

  // Send cancellation email
  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  if (user?.email) {
    try {
      await sendSubscriptionCancelledEmail(
        user.email,
        user.full_name || 'Valued Customer',
        new Date().toLocaleDateString('ko-KR')
      );
    } catch (emailError) {
      logger.warn('lemonsqueezy_cancellation_email_failed', {
        requestId,
        userId,
        error: emailError instanceof Error ? emailError.message : 'Unknown',
      });
    }
  }

  logger.info('lemonsqueezy_user_downgraded_to_free', {
    requestId,
    userId,
  });
}

async function handleSubscriptionPaused(
  requestId: string,
  payload: WebhookPayload
): Promise<void> {
  const userId = payload.meta.custom_data?.user_id;

  if (!userId) return;

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    logger.error('lemonsqueezy_subscription_pause_failed', {
      requestId,
      userId,
      error: error.message,
    });
  }

  logger.info('lemonsqueezy_subscription_paused', { requestId, userId });
}

async function handlePaymentSuccess(
  requestId: string,
  payload: WebhookPayload
): Promise<void> {
  const userId = payload.meta.custom_data?.user_id;

  if (!userId) return;

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      ai_chats_used: 0,
      esim_data_used_mb: 0,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    logger.error('lemonsqueezy_usage_reset_failed', {
      requestId,
      userId,
      error: error.message,
    });
  }

  logger.info('lemonsqueezy_payment_success_usage_reset', {
    requestId,
    userId,
  });
}

async function handlePaymentFailed(
  requestId: string,
  payload: WebhookPayload
): Promise<void> {
  const userId = payload.meta.custom_data?.user_id;

  if (!userId) return;

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    logger.error('lemonsqueezy_status_update_failed', {
      requestId,
      userId,
      error: error.message,
    });
  }

  // Send payment failed email
  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('plan_id')
    .eq('user_id', userId)
    .single();

  if (user?.email) {
    const planName = subscription?.plan_id
      ? SUBSCRIPTION_PLANS[subscription.plan_id as keyof typeof SUBSCRIPTION_PLANS]?.name || 'Premium'
      : 'Premium';

    try {
      await sendPaymentFailedEmail(
        user.email,
        user.full_name || 'Valued Customer',
        planName
      );
    } catch (emailError) {
      logger.warn('lemonsqueezy_payment_failed_email_error', {
        requestId,
        userId,
        error: emailError instanceof Error ? emailError.message : 'Unknown',
      });
    }
  }

  logger.info('lemonsqueezy_payment_failed', { requestId, userId });
}

async function handleOrderCreated(
  requestId: string,
  payload: WebhookPayload
): Promise<void> {
  logger.info('lemonsqueezy_order_created', {
    requestId,
    orderId: payload.data.id,
    userId: payload.meta.custom_data?.user_id,
  });
}
