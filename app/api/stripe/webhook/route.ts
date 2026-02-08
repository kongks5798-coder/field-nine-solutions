/**
 * NOMAD - Stripe Webhook Handler
 * Handle subscription events from Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/server';
import { SUBSCRIPTION_PLANS, PlanId } from '@/lib/config/brand';
import { sendPaymentFailedEmail } from '@/lib/email/notifications';

export const runtime = 'nodejs';

// Initialize Stripe only if API key is available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Plan ID mapping from Stripe price IDs
const STRIPE_PRICE_TO_PLAN: Record<string, PlanId> = {
  // Monthly
  [process.env.STRIPE_PRICE_EXPLORER_MONTHLY || '']: 'explorer',
  [process.env.STRIPE_PRICE_TRAVELER_MONTHLY || '']: 'traveler',
  [process.env.STRIPE_PRICE_NOMAD_MONTHLY || '']: 'nomad',
  [process.env.STRIPE_PRICE_BUSINESS_MONTHLY || '']: 'business',
  // Yearly
  [process.env.STRIPE_PRICE_EXPLORER_YEARLY || '']: 'explorer',
  [process.env.STRIPE_PRICE_TRAVELER_YEARLY || '']: 'traveler',
  [process.env.STRIPE_PRICE_NOMAD_YEARLY || '']: 'nomad',
  [process.env.STRIPE_PRICE_BUSINESS_YEARLY || '']: 'business',
};

// Helper to safely extract subscription period
function getSubscriptionPeriod(subscription: Record<string, unknown>) {
  const now = Date.now() / 1000;
  const defaultEnd = now + 30 * 24 * 60 * 60; // 30 days

  const start = typeof subscription.current_period_start === 'number'
    ? subscription.current_period_start
    : now;
  const end = typeof subscription.current_period_end === 'number'
    ? subscription.current_period_end
    : defaultEnd;

  return { start, end };
}

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    console.error('[Stripe Webhook] Stripe not configured');
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('[Stripe Webhook] Checkout completed:', session.id);

  if (!stripe) {
    console.error('[Stripe Webhook] Stripe not configured');
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) {
    console.log('[Stripe Webhook] No customer or subscription ID in checkout session');
    return;
  }

  // Get subscription details
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscription = subscriptionResponse as any;

  // Get plan ID from price
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const planId = STRIPE_PRICE_TO_PLAN[priceId] || 'explorer';
  const plan = SUBSCRIPTION_PLANS[planId];

  // Determine billing cycle
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
  const billingCycle = interval === 'year' ? 'yearly' : 'monthly';

  // Find user by customer ID
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!existingSub) {
    console.error('[Stripe Webhook] No user found for customer:', customerId);
    return;
  }

  // Get period timestamps safely
  const { start: periodStart, end: periodEnd } = getSubscriptionPeriod(subscription);

  // Update subscription
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      stripe_subscription_id: subscriptionId,
      plan_id: planId,
      status: 'active',
      billing_cycle: billingCycle,
      current_period_start: new Date(periodStart * 1000).toISOString(),
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      ai_chats_limit: plan.features.aiChats,
      esim_data_limit_mb: plan.features.esimData === -1 ? -1 : plan.features.esimData * 1024,
      ai_chats_used: 0,
      esim_data_used_mb: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', existingSub.user_id);

  if (error) {
    console.error('[Stripe Webhook] Failed to update subscription:', error);
    throw error;
  }

  console.log('[Stripe Webhook] Subscription activated for user:', existingSub.user_id);
}

/**
 * Handle subscription created or updated
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(subscriptionData: any) {
  console.log('[Stripe Webhook] Subscription updated:', subscriptionData.id);

  const customerId = subscriptionData.customer as string;
  const priceId = subscriptionData.items?.data?.[0]?.price?.id;
  const planId = STRIPE_PRICE_TO_PLAN[priceId] || 'explorer';
  const plan = SUBSCRIPTION_PLANS[planId];

  // Map Stripe status to our status
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
  };

  const status = statusMap[subscriptionData.status] || 'active';
  const interval = subscriptionData.items?.data?.[0]?.price?.recurring?.interval;
  const billingCycle = interval === 'year' ? 'yearly' : 'monthly';

  // Get period timestamps safely
  const { start: periodStart, end: periodEnd } = getSubscriptionPeriod(subscriptionData);

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      stripe_subscription_id: subscriptionData.id,
      plan_id: planId,
      status,
      billing_cycle: billingCycle,
      current_period_start: new Date(periodStart * 1000).toISOString(),
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      cancel_at_period_end: subscriptionData.cancel_at_period_end ?? false,
      ai_chats_limit: plan.features.aiChats,
      esim_data_limit_mb: plan.features.esimData === -1 ? -1 : plan.features.esimData * 1024,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('[Stripe Webhook] Failed to update subscription:', error);
    throw error;
  }
}

/**
 * Handle subscription deleted
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionDeleted(subscriptionData: any) {
  console.log('[Stripe Webhook] Subscription deleted:', subscriptionData.id);

  const customerId = subscriptionData.customer as string;

  // Downgrade to free plan
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      plan_id: 'free',
      status: 'active',
      stripe_subscription_id: null,
      billing_cycle: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
      ai_chats_limit: SUBSCRIPTION_PLANS.free.features.aiChats,
      esim_data_limit_mb: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('[Stripe Webhook] Failed to downgrade subscription:', error);
    throw error;
  }

  console.log('[Stripe Webhook] User downgraded to free plan');
}

/**
 * Handle successful invoice payment
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleInvoicePaid(invoice: any) {
  console.log('[Stripe Webhook] Invoice paid:', invoice.id);

  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  // Reset monthly usage on successful payment
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      ai_chats_used: 0,
      esim_data_used_mb: 0,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('[Stripe Webhook] Failed to reset usage:', error);
  }
}

/**
 * Handle failed invoice payment
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleInvoicePaymentFailed(invoice: any) {
  console.log('[Stripe Webhook] Invoice payment failed:', invoice.id);

  const customerId = invoice.customer as string;

  // Update status to past_due
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('[Stripe Webhook] Failed to update status:', error);
  }

  // Get user info for email notification
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, plan_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (subscription?.user_id) {
    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', subscription.user_id)
      .single();

    if (user?.email) {
      const planName = subscription.plan_id
        ? SUBSCRIPTION_PLANS[subscription.plan_id as PlanId]?.name || 'Premium'
        : 'Premium';

      await sendPaymentFailedEmail(
        user.email,
        user.full_name || 'Valued Customer',
        planName
      );
    }
  }
}
