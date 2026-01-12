/**
 * K-UNIVERSAL Stripe Client
 * Tesla-grade payment processing for Ghost Wallet
 */

import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Client-side Stripe instance (for React components)
export const getStripePublishableKey = (): string => {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy_key_for_build';
};

/**
 * Ghost Wallet Payment Types
 */
export interface PaymentIntentParams {
  amount: number; // in cents (e.g., $10.00 = 1000)
  currency: string; // 'usd', 'krw', etc.
  userId: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

/**
 * Create Stripe Payment Intent for card top-up
 */
export async function createPaymentIntent(
  params: PaymentIntentParams
): Promise<PaymentIntentResult> {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      metadata: {
        userId: params.userId,
        type: 'ghost_wallet_topup',
        ...params.metadata,
      },
      description: params.description || 'K-Universal Ghost Wallet Top-up',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret || undefined,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Stripe Payment Intent creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed',
    };
  }
}

/**
 * Create Stripe Customer for user
 */
export async function createStripeCustomer(params: {
  email: string;
  name: string;
  userId: string;
}): Promise<{ customerId: string | null; error?: string }> {
  try {
    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        userId: params.userId,
      },
    });

    return { customerId: customer.id };
  } catch (error) {
    return {
      customerId: null,
      error: error instanceof Error ? error.message : 'Customer creation failed',
    };
  }
}

/**
 * Attach payment method to customer
 */
export async function attachPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to attach payment method',
    };
  }
}

/**
 * Get payment history for a user
 */
export async function getPaymentHistory(userId: string): Promise<Stripe.PaymentIntent[]> {
  try {
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
    });

    // Filter by userId metadata
    return paymentIntents.data.filter((pi) => pi.metadata.userId === userId);
  } catch (error) {
    console.error('Failed to fetch payment history:', error);
    return [];
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(
  paymentIntentId: string,
  amount?: number
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount, // Optional: partial refund
    });

    return {
      success: true,
      refundId: refund.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund failed',
    };
  }
}
