/**
 * NOMAD - LemonSqueezy Webhook Handler
 * Handle subscription events from LemonSqueezy
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyWebhookSignature, getPlanIdFromVariant } from '@/lib/lemonsqueezy/client';
import { SUBSCRIPTION_PLANS } from '@/lib/config/brand';

export const runtime = 'nodejs';

// LemonSqueezy webhook event types
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
    attributes: Record<string, unknown>;
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

/**
 * POST /api/lemonsqueezy/webhook
 * Handle LemonSqueezy webhook events
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-signature') || '';

  // Verify webhook signature
  if (!verifyWebhookSignature(body, signature)) {
    console.error('[LemonSqueezy Webhook] Invalid signature');
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const eventName = payload.meta.event_name;
  console.log(`[LemonSqueezy Webhook] Received event: ${eventName}`);

  try {
    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
      case 'subscription_resumed':
      case 'subscription_unpaused':
        await handleSubscriptionActive(payload);
        break;

      case 'subscription_cancelled':
      case 'subscription_expired':
        await handleSubscriptionEnded(payload);
        break;

      case 'subscription_paused':
        await handleSubscriptionPaused(payload);
        break;

      case 'subscription_payment_success':
        await handlePaymentSuccess(payload);
        break;

      case 'subscription_payment_failed':
        await handlePaymentFailed(payload);
        break;

      case 'order_created':
        await handleOrderCreated(payload);
        break;

      default:
        console.log(`[LemonSqueezy Webhook] Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[LemonSqueezy Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle active subscription (created, updated, resumed)
 */
async function handleSubscriptionActive(payload: WebhookPayload) {
  const attrs = payload.data.attributes;
  const userId = payload.meta.custom_data?.user_id;
  const customerId = payload.data.relationships?.customer?.data?.id;
  const variantId = payload.data.relationships?.variant?.data?.id || '';
  const subscriptionId = payload.data.id;

  if (!userId) {
    console.error('[LemonSqueezy Webhook] No user_id in custom data');
    return;
  }

  const planId = getPlanIdFromVariant(variantId);
  const plan = SUBSCRIPTION_PLANS[planId];

  // Map LemonSqueezy status to our status
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
  const billingCycle = (attrs.variant_name as string)?.toLowerCase().includes('year') ? 'yearly' : 'monthly';

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      lemonsqueezy_subscription_id: subscriptionId,
      lemonsqueezy_customer_id: customerId,
      plan_id: planId,
      status,
      billing_cycle: billingCycle,
      current_period_start: attrs.current_period_start ? new Date(attrs.current_period_start as string).toISOString() : null,
      current_period_end: attrs.renews_at ? new Date(attrs.renews_at as string).toISOString() : null,
      cancel_at_period_end: attrs.cancelled as boolean || false,
      ai_chats_limit: plan.features.aiChats,
      esim_data_limit_mb: plan.features.esimData === -1 ? -1 : plan.features.esimData * 1024,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('[LemonSqueezy Webhook] Failed to update subscription:', error);
    throw error;
  }

  console.log(`[LemonSqueezy Webhook] Subscription activated for user: ${userId}`);
}

/**
 * Handle subscription ended (cancelled, expired)
 */
async function handleSubscriptionEnded(payload: WebhookPayload) {
  const userId = payload.meta.custom_data?.user_id;

  if (!userId) {
    console.error('[LemonSqueezy Webhook] No user_id in custom data');
    return;
  }

  // Downgrade to free plan
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
    console.error('[LemonSqueezy Webhook] Failed to downgrade subscription:', error);
    throw error;
  }

  console.log(`[LemonSqueezy Webhook] User downgraded to free: ${userId}`);
}

/**
 * Handle subscription paused
 */
async function handleSubscriptionPaused(payload: WebhookPayload) {
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
    console.error('[LemonSqueezy Webhook] Failed to pause subscription:', error);
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(payload: WebhookPayload) {
  const userId = payload.meta.custom_data?.user_id;

  if (!userId) return;

  // Reset monthly usage on successful payment
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
    console.error('[LemonSqueezy Webhook] Failed to reset usage:', error);
  }

  console.log(`[LemonSqueezy Webhook] Payment success, usage reset for: ${userId}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(payload: WebhookPayload) {
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
    console.error('[LemonSqueezy Webhook] Failed to update status:', error);
  }

  // TODO: Send email notification about payment failure
  console.log(`[LemonSqueezy Webhook] Payment failed for: ${userId}`);
}

/**
 * Handle order created (one-time or first subscription payment)
 */
async function handleOrderCreated(payload: WebhookPayload) {
  console.log('[LemonSqueezy Webhook] Order created:', payload.data.id);
  // Additional processing if needed
}
