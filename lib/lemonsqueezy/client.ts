/**
 * NOMAD - LemonSqueezy Integration
 * Subscription & Payment Management
 *
 * Docs: https://docs.lemonsqueezy.com/api
 */

import { SUBSCRIPTION_PLANS, PlanId } from '../config/brand';

// ============================================
// Configuration
// ============================================

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;
const LEMONSQUEEZY_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

const API_BASE = 'https://api.lemonsqueezy.com/v1';

export const lemonSqueezyConfig = {
  apiKey: LEMONSQUEEZY_API_KEY || '',
  storeId: LEMONSQUEEZY_STORE_ID || '',
  webhookSecret: LEMONSQUEEZY_WEBHOOK_SECRET || '',
};

export function validateLemonSqueezyConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!LEMONSQUEEZY_API_KEY) errors.push('LEMONSQUEEZY_API_KEY is not set');
  if (!LEMONSQUEEZY_STORE_ID) errors.push('LEMONSQUEEZY_STORE_ID is not set');
  return { valid: errors.length === 0, errors };
}

// ============================================
// Types
// ============================================

export interface LemonSqueezyCustomer {
  id: string;
  email: string;
  name?: string;
}

export interface LemonSqueezySubscription {
  id: string;
  customerId: string;
  status: 'on_trial' | 'active' | 'paused' | 'past_due' | 'unpaid' | 'cancelled' | 'expired';
  planId: PlanId;
  variantId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutSession {
  url: string;
}

// ============================================
// Variant ID Mapping (LemonSqueezy uses Variant IDs)
// ============================================

// Map plan IDs to LemonSqueezy variant IDs
export function getVariantId(planId: PlanId, isYearly: boolean): string | null {
  const variantKey = isYearly
    ? `LEMONSQUEEZY_VARIANT_${planId.toUpperCase()}_YEARLY`
    : `LEMONSQUEEZY_VARIANT_${planId.toUpperCase()}_MONTHLY`;

  return process.env[variantKey] || null;
}

// Reverse mapping: variant ID to plan ID
export function getPlanIdFromVariant(variantId: string): PlanId {
  const variantMappings: Record<string, PlanId> = {
    [process.env.LEMONSQUEEZY_VARIANT_EXPLORER_MONTHLY || '']: 'explorer',
    [process.env.LEMONSQUEEZY_VARIANT_EXPLORER_YEARLY || '']: 'explorer',
    [process.env.LEMONSQUEEZY_VARIANT_TRAVELER_MONTHLY || '']: 'traveler',
    [process.env.LEMONSQUEEZY_VARIANT_TRAVELER_YEARLY || '']: 'traveler',
    [process.env.LEMONSQUEEZY_VARIANT_NOMAD_MONTHLY || '']: 'nomad',
    [process.env.LEMONSQUEEZY_VARIANT_NOMAD_YEARLY || '']: 'nomad',
    [process.env.LEMONSQUEEZY_VARIANT_BUSINESS_MONTHLY || '']: 'business',
    [process.env.LEMONSQUEEZY_VARIANT_BUSINESS_YEARLY || '']: 'business',
  };

  return variantMappings[variantId] || 'free';
}

// ============================================
// API Helper
// ============================================

async function lemonSqueezyFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
      ...options.headers,
    },
  });
}

// ============================================
// Server-side Functions
// ============================================

/**
 * Create checkout URL for subscription
 */
export async function createCheckoutUrl(
  variantId: string,
  options: {
    email?: string;
    name?: string;
    userId?: string;
    successUrl: string;
    cancelUrl?: string;
  }
): Promise<CheckoutSession | null> {
  if (!LEMONSQUEEZY_API_KEY || !LEMONSQUEEZY_STORE_ID) {
    console.error('[LemonSqueezy] API key or Store ID not configured');
    return null;
  }

  try {
    const checkoutData: Record<string, unknown> = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: options.email,
            name: options.name,
            custom: {
              user_id: options.userId,
            },
          },
          checkout_options: {
            embed: false,
            media: true,
            logo: true,
            desc: true,
            discount: true,
            button_color: '#10B981', // Emerald color
          },
          product_options: {
            enabled_variants: [parseInt(variantId)],
            redirect_url: options.successUrl,
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: LEMONSQUEEZY_STORE_ID,
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: variantId,
            },
          },
        },
      },
    };

    const response = await lemonSqueezyFetch('/checkouts', {
      method: 'POST',
      body: JSON.stringify(checkoutData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[LemonSqueezy] Checkout error:', data);
      throw new Error(data.errors?.[0]?.detail || 'Failed to create checkout');
    }

    return {
      url: data.data.attributes.url,
    };
  } catch (error) {
    console.error('[LemonSqueezy] Create checkout error:', error);
    return null;
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<LemonSqueezySubscription | null> {
  if (!LEMONSQUEEZY_API_KEY) return null;

  try {
    const response = await lemonSqueezyFetch(`/subscriptions/${subscriptionId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to get subscription');
    }

    const attrs = data.data.attributes;
    const variantId = data.data.relationships?.variant?.data?.id;

    return {
      id: data.data.id,
      customerId: data.data.relationships?.customer?.data?.id,
      status: attrs.status,
      planId: getPlanIdFromVariant(variantId),
      variantId,
      currentPeriodStart: new Date(attrs.current_period_start),
      currentPeriodEnd: new Date(attrs.current_period_end),
      cancelAtPeriodEnd: attrs.cancelled,
    };
  } catch (error) {
    console.error('[LemonSqueezy] Get subscription error:', error);
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  if (!LEMONSQUEEZY_API_KEY) return false;

  try {
    const response = await lemonSqueezyFetch(`/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          type: 'subscriptions',
          id: subscriptionId,
          attributes: {
            cancelled: true,
          },
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[LemonSqueezy] Cancel subscription error:', error);
    return false;
  }
}

/**
 * Resume subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<boolean> {
  if (!LEMONSQUEEZY_API_KEY) return false;

  try {
    const response = await lemonSqueezyFetch(`/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          type: 'subscriptions',
          id: subscriptionId,
          attributes: {
            cancelled: false,
          },
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[LemonSqueezy] Resume subscription error:', error);
    return false;
  }
}

/**
 * Get customer portal URL
 */
export async function getCustomerPortalUrl(customerId: string): Promise<string | null> {
  if (!LEMONSQUEEZY_API_KEY) return null;

  try {
    const response = await lemonSqueezyFetch(`/customers/${customerId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to get customer');
    }

    return data.data.attributes.urls?.customer_portal || null;
  } catch (error) {
    console.error('[LemonSqueezy] Get customer portal error:', error);
    return null;
  }
}

// ============================================
// Webhook Verification
// ============================================

import crypto from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!LEMONSQUEEZY_WEBHOOK_SECRET) return false;

  try {
    const hmac = crypto.createHmac('sha256', LEMONSQUEEZY_WEBHOOK_SECRET);
    const digest = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

// ============================================
// Utility Functions
// ============================================

export function getPlanById(planId: PlanId) {
  return SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
