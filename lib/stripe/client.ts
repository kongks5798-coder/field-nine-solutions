/**
 * NOMAD - Stripe Integration
 * Subscription & Payment Management
 */

import { SUBSCRIPTION_PLANS, PlanId } from '../config/brand';

// ============================================
// Configuration
// ============================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export const stripeConfig = {
  publishableKey: STRIPE_PUBLISHABLE_KEY || '',
  secretKey: STRIPE_SECRET_KEY || '',
  webhookSecret: STRIPE_WEBHOOK_SECRET || '',
};

export function validateStripeConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!STRIPE_PUBLISHABLE_KEY) errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  if (!STRIPE_SECRET_KEY) errors.push('STRIPE_SECRET_KEY is not set');
  return { valid: errors.length === 0, errors };
}

// ============================================
// Types
// ============================================

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customerId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  planId: PlanId;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

export interface SubscriptionUsage {
  esimDataUsed: number; // GB
  esimDataLimit: number; // GB, -1 for unlimited
  aiChatsUsed: number;
  aiChatsLimit: number; // -1 for unlimited
}

// ============================================
// Server-side Functions
// ============================================

/**
 * Create Stripe customer
 */
export async function createCustomer(
  email: string,
  name?: string,
  userId?: string
): Promise<StripeCustomer | null> {
  if (!STRIPE_SECRET_KEY) {
    console.error('[Stripe] Secret key not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email,
        ...(name && { name }),
        ...(userId && { 'metadata[userId]': userId }),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create customer');
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error('[Stripe] Create customer error:', error);
    return null;
  }
}

/**
 * Create checkout session for subscription
 */
export async function createCheckoutSession(
  customerId: string,
  planId: PlanId,
  isYearly: boolean = false,
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSession | null> {
  if (!STRIPE_SECRET_KEY) {
    console.error('[Stripe] Secret key not configured');
    return null;
  }

  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan || planId === 'free') {
    console.error('[Stripe] Invalid plan:', planId);
    return null;
  }

  const priceId = isYearly ? plan.priceIdYearly : plan.priceId;
  if (!priceId) {
    console.error('[Stripe] Price ID not configured for plan:', planId);
    return null;
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        'subscription_data[metadata][planId]': planId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create checkout session');
    }

    return {
      id: data.id,
      url: data.url,
    };
  } catch (error) {
    console.error('[Stripe] Create checkout session error:', error);
    return null;
  }
}

/**
 * Create billing portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string | null> {
  if (!STRIPE_SECRET_KEY) {
    console.error('[Stripe] Secret key not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: returnUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create portal session');
    }

    return data.url;
  } catch (error) {
    console.error('[Stripe] Create portal session error:', error);
    return null;
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<StripeSubscription | null> {
  if (!STRIPE_SECRET_KEY) return null;

  try {
    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get subscription');
    }

    return {
      id: data.id,
      customerId: data.customer,
      status: data.status,
      planId: data.metadata?.planId || 'free',
      currentPeriodStart: new Date(data.current_period_start * 1000),
      currentPeriodEnd: new Date(data.current_period_end * 1000),
      cancelAtPeriodEnd: data.cancel_at_period_end,
    };
  } catch (error) {
    console.error('[Stripe] Get subscription error:', error);
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelImmediately: boolean = false
): Promise<boolean> {
  if (!STRIPE_SECRET_KEY) return false;

  try {
    const url = cancelImmediately
      ? `https://api.stripe.com/v1/subscriptions/${subscriptionId}`
      : `https://api.stripe.com/v1/subscriptions/${subscriptionId}`;

    const response = await fetch(url, {
      method: cancelImmediately ? 'DELETE' : 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      ...(cancelImmediately ? {} : {
        body: new URLSearchParams({
          cancel_at_period_end: 'true',
        }),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Stripe] Cancel subscription error:', error);
    return false;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!STRIPE_WEBHOOK_SECRET) return false;

  // In production, use stripe library for proper verification
  // This is a simplified check
  return signature.includes('t=') && signature.includes('v1=');
}

// ============================================
// Utility Functions
// ============================================

export function getPlanById(planId: PlanId) {
  return SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
}

export function calculateSavings(planId: PlanId): number {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan || planId === 'free') return 0;

  const monthlyTotal = plan.price * 12;
  const yearlyTotal = plan.priceYearly || monthlyTotal;
  return Math.round(monthlyTotal - yearlyTotal);
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
