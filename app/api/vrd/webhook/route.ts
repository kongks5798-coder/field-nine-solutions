/**
 * VRD 26SS - Stripe Webhook Handler
 * Production-Grade Payment Event Processing
 *
 * Handles:
 * - payment_intent.succeeded: Update order status + Send confirmation email
 * - payment_intent.payment_failed: Update status + Notify customer
 * - charge.refunded: Process refund
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getProductById } from '@/lib/vrd/products';
import { processVRDPurchaseReward } from '@/lib/referral/engine';
import { notifyVRDPayment, trackDailyRevenue, notifyReferralReward } from '@/lib/notifications/telegram';

export const runtime = 'nodejs';

// ============================================
// Configuration
// ============================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_VRD_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.VRD_FROM_EMAIL || 'VRD <orders@vrd.fieldnine.io>';

// Initialize Stripe
const getStripe = () => {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });
};

// Initialize Supabase
const getSupabase = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
};

// ============================================
// Webhook Handler
// ============================================

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[VRD Webhook] Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('[VRD Webhook] Webhook secret not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[VRD Webhook] Signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log(`[VRD Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`[VRD Webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[VRD Webhook] Processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// ============================================
// Event Handlers
// ============================================

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('[VRD Webhook] Payment succeeded:', paymentIntent.id);

  const supabase = getSupabase();
  const orderId = paymentIntent.metadata?.order_id;

  if (!orderId) {
    console.error('[VRD Webhook] No order_id in payment intent metadata');
    return;
  }

  // Step 1: Fetch order details
  const { data: order, error: fetchError } = await supabase
    .from('vrd_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    console.error('[VRD Webhook] Order not found:', orderId);
    return;
  }

  // Step 2: Update order status to 'paid'
  const { error: updateError } = await supabase
    .from('vrd_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    console.error('[VRD Webhook] Failed to update order status:', updateError);
    throw updateError;
  }

  console.log('[VRD Webhook] Order status updated to paid:', orderId);

  // Step 3: Update inventory (decrease stock)
  try {
    await updateInventory(order.items, supabase);
  } catch (inventoryError) {
    console.error('[VRD Webhook] Inventory update failed:', inventoryError);
    // Don't throw - order is still valid
  }

  // Step 4: Send confirmation email
  try {
    await sendOrderConfirmationEmail({
      orderId,
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      items: order.items,
      total: order.total,
      currency: order.currency,
      shippingAddress: JSON.parse(order.shipping_address),
      bundleType: order.bundle_type,
      discount: order.discount,
    });
    console.log('[VRD Webhook] Confirmation email sent to:', order.customer_email);
  } catch (emailError) {
    console.error('[VRD Webhook] Email sending failed:', emailError);
    // Don't throw - order is still valid
  }

  // Step 5: Log successful payment
  await supabase.from('vrd_payment_logs').insert({
    order_id: orderId,
    payment_intent_id: paymentIntent.id,
    event_type: 'payment_succeeded',
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    created_at: new Date().toISOString(),
  });

  // Step 6: Grant Early Bird Sovereign badge (Phase 53 Revenue Engine)
  try {
    await grantEarlyBirdSovereignBadge(order.customer_email, orderId, supabase);
    console.log('[VRD Webhook] Early Bird Sovereign badge granted to:', order.customer_email);
  } catch (badgeError) {
    console.error('[VRD Webhook] Badge granting failed:', badgeError);
    // Don't throw - order is still valid
  }

  // Step 7: Process referral reward (Phase 54 Referral Engine)
  let referralRewardAmount = 0;
  let referrerSovereignNumber = 0;
  try {
    const currency = (paymentIntent.currency?.toUpperCase() as 'KRW' | 'USD') || 'KRW';
    const purchaseAmount = paymentIntent.amount; // Amount in smallest unit
    const actualAmount = currency === 'KRW' ? purchaseAmount : purchaseAmount / 100;

    const referralResult = await processVRDPurchaseReward(
      orderId,
      order.customer_email,
      actualAmount,
      currency
    );

    if (referralResult.success && referralResult.rewardAmount && referralResult.rewardAmount > 0) {
      console.log(`[VRD Webhook] Referral reward processed: ${referralResult.rewardAmount} KAUS`);
      referralRewardAmount = referralResult.rewardAmount;
      referrerSovereignNumber = referralResult.referrerSovereignNumber || 0;
    }
  } catch (referralError) {
    console.error('[VRD Webhook] Referral reward processing failed:', referralError);
    // Don't throw - order is still valid
  }

  // Step 8: Send Telegram Revenue Alert (Phase 55)
  try {
    const currency = (paymentIntent.currency?.toUpperCase() as 'KRW' | 'USD') || 'KRW';
    const purchaseAmount = paymentIntent.amount;
    const actualAmount = currency === 'KRW' ? purchaseAmount : purchaseAmount / 100;

    // Track daily revenue and get current total
    const dailyTotal = await trackDailyRevenue(
      currency === 'KRW' ? actualAmount : actualAmount * 1400 // Convert USD to KRW for tracking
    );

    // Get customer's sovereign number
    const { data: profile } = await supabase
      .from('profiles')
      .select('sovereign_number')
      .eq('email', order.customer_email)
      .maybeSingle();

    // Get product name from items
    const items = order.items;
    const productName = Array.isArray(items) && items.length > 0
      ? items.map((item: { name?: string }) => item.name || 'VRD Product').join(', ')
      : 'VRD Product';

    // Send VRD payment notification
    await notifyVRDPayment(
      actualAmount,
      currency,
      productName,
      profile?.sovereign_number,
      dailyTotal
    );

    // Send referral reward notification if applicable
    if (referralRewardAmount > 0 && referrerSovereignNumber > 0) {
      await notifyReferralReward(referralRewardAmount, referrerSovereignNumber);
    }

    console.log('[VRD Webhook] Telegram notification sent');
  } catch (telegramError) {
    console.error('[VRD Webhook] Telegram notification failed:', telegramError);
    // Don't throw - order is still valid
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('[VRD Webhook] Payment failed:', paymentIntent.id);

  const supabase = getSupabase();
  const orderId = paymentIntent.metadata?.order_id;

  if (!orderId) return;

  // Fetch order
  const { data: order } = await supabase
    .from('vrd_orders')
    .select('customer_email, customer_name')
    .eq('id', orderId)
    .single();

  // Update order status
  await supabase
    .from('vrd_orders')
    .update({
      status: 'cancelled',
      cancelled_reason: 'Payment failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  // Send failure notification email
  if (order?.customer_email) {
    await sendPaymentFailedEmail({
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      orderId,
      errorMessage: paymentIntent.last_payment_error?.message || 'Payment could not be processed',
    });
  }

  // Log failed payment
  await supabase.from('vrd_payment_logs').insert({
    order_id: orderId,
    payment_intent_id: paymentIntent.id,
    event_type: 'payment_failed',
    error_message: paymentIntent.last_payment_error?.message,
    created_at: new Date().toISOString(),
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('[VRD Webhook] Charge refunded:', charge.id);

  const supabase = getSupabase();
  const paymentIntentId = charge.payment_intent as string;

  // Find order by payment intent
  const { data: order } = await supabase
    .from('vrd_orders')
    .select('id, customer_email, customer_name, total, currency')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (!order) {
    console.error('[VRD Webhook] Order not found for refund:', paymentIntentId);
    return;
  }

  // Determine if full or partial refund
  const refundAmount = charge.amount_refunded;
  const isFullRefund = refundAmount >= (order.total || 0);

  // Update order status
  await supabase
    .from('vrd_orders')
    .update({
      status: isFullRefund ? 'refunded' : 'partially_refunded',
      refunded_amount: refundAmount,
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  // Send refund confirmation email
  await sendRefundConfirmationEmail({
    customerEmail: order.customer_email,
    customerName: order.customer_name,
    orderId: order.id,
    refundAmount,
    currency: order.currency,
    isFullRefund,
  });
}

// ============================================
// Inventory Management
// ============================================

interface CartItem {
  productId: string;
  color: string;
  size: string;
  quantity: number;
}

async function updateInventory(items: CartItem[], supabase: ReturnType<typeof getSupabase>) {
  for (const item of items) {
    const product = getProductById(item.productId);
    if (!product) continue;

    // Update product inventory in database
    await supabase.rpc('decrement_vrd_inventory', {
      p_product_id: item.productId,
      p_color: item.color,
      p_quantity: item.quantity,
    });
  }
}

// ============================================
// Email Functions
// ============================================

interface OrderConfirmationData {
  orderId: string;
  customerEmail: string;
  customerName: string;
  items: CartItem[];
  total: number;
  currency: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  };
  bundleType: string;
  discount: number;
}

async function sendOrderConfirmationEmail(data: OrderConfirmationData) {
  if (!RESEND_API_KEY) {
    console.log('[VRD Email] RESEND_API_KEY not configured, skipping email');
    return;
  }

  const itemsHtml = data.items
    .map(item => {
      const product = getProductById(item.productId);
      if (!product) return '';
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${product.name}</strong><br>
            <span style="color: #666; font-size: 14px;">${product.nameKo}</span><br>
            <span style="color: #888; font-size: 12px;">Color: ${item.color} | Size: ${item.size}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
            ${formatCurrency((data.currency === 'KRW' ? product.basePrice : product.priceUSD) * item.quantity, data.currency)}
          </td>
        </tr>
      `;
    })
    .join('');

  const bundleLabel = getBundleLabel(data.bundleType);
  const discountHtml = data.discount > 0
    ? `
      <tr>
        <td colspan="2" style="padding: 8px 12px; text-align: right; color: #22c55e;">
          <strong>${bundleLabel} 할인</strong>
        </td>
        <td style="padding: 8px 12px; text-align: right; color: #22c55e; font-weight: bold;">
          -${formatCurrency(data.discount, data.currency)}
        </td>
      </tr>
    `
    : '';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F9F9F7; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="background-color: #171717; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #F9F9F7; margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: 300;">VRD</h1>
          <p style="color: #888; margin: 8px 0 0; font-size: 12px; letter-spacing: 2px;">26SS COLLECTION</p>
        </div>

        <!-- Content -->
        <div style="background-color: #fff; padding: 32px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #171717; margin: 0 0 24px; font-size: 24px; font-weight: 500;">주문이 확정되었습니다</h2>

          <p style="color: #666; margin: 0 0 24px; line-height: 1.6;">
            안녕하세요, <strong>${data.customerName}</strong>님.<br>
            VRD 26SS 컬렉션을 선택해 주셔서 감사합니다.
          </p>

          <!-- Order Info -->
          <div style="background-color: #F9F9F7; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0; color: #888; font-size: 12px;">주문번호</p>
            <p style="margin: 4px 0 0; color: #171717; font-size: 18px; font-weight: 600; letter-spacing: 1px;">${data.orderId}</p>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #F9F9F7;">
                <th style="padding: 12px; text-align: left; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">상품</th>
                <th style="padding: 12px; text-align: center; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">수량</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">금액</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              ${discountHtml}
              <tr>
                <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: bold; font-size: 16px;">
                  총 결제금액
                </td>
                <td style="padding: 16px 12px; text-align: right; font-weight: bold; font-size: 20px; color: #171717;">
                  ${formatCurrency(data.total, data.currency)}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Shipping Address -->
          <div style="border-top: 1px solid #eee; padding-top: 24px; margin-bottom: 24px;">
            <h3 style="color: #171717; margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">배송지</h3>
            <p style="color: #666; margin: 0; line-height: 1.6;">
              ${data.shippingAddress.line1}<br>
              ${data.shippingAddress.line2 ? data.shippingAddress.line2 + '<br>' : ''}
              ${data.shippingAddress.city}${data.shippingAddress.state ? ', ' + data.shippingAddress.state : ''} ${data.shippingAddress.postal_code}<br>
              ${data.shippingAddress.country}
            </p>
          </div>

          <!-- Footer Note -->
          <div style="background-color: #F9F9F7; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #888; font-size: 14px;">
              배송 시작 시 별도의 안내 메일을 발송해 드립니다.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 24px;">
          <p style="color: #888; font-size: 12px; margin: 0;">
            © 2026 VRD by Field Nine. All rights reserved.
          </p>
          <p style="color: #aaa; font-size: 11px; margin: 8px 0 0;">
            Versatility · Restraint · Design
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `[VRD] 주문 확인 - ${data.orderId}`,
      html: emailHtml,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }
}

async function sendPaymentFailedEmail(data: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  errorMessage: string;
}) {
  if (!RESEND_API_KEY) return;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F9F9F7; margin: 0; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 8px;">
        <h1 style="color: #171717; font-size: 24px; margin: 0 0 24px;">결제 실패 안내</h1>
        <p style="color: #666; line-height: 1.6;">
          안녕하세요, ${data.customerName}님.<br><br>
          주문번호 <strong>${data.orderId}</strong>의 결제가 실패했습니다.<br><br>
          <strong>사유:</strong> ${data.errorMessage}<br><br>
          다시 결제를 시도해 주시거나, 다른 결제 수단을 이용해 주세요.
        </p>
        <a href="https://vrd.fieldnine.io/checkout" style="display: inline-block; background: #171717; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">다시 결제하기</a>
      </div>
    </body>
    </html>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `[VRD] 결제 실패 안내 - ${data.orderId}`,
      html: emailHtml,
    }),
  });
}

async function sendRefundConfirmationEmail(data: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  refundAmount: number;
  currency: string;
  isFullRefund: boolean;
}) {
  if (!RESEND_API_KEY) return;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F9F9F7; margin: 0; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 8px;">
        <h1 style="color: #171717; font-size: 24px; margin: 0 0 24px;">환불 완료 안내</h1>
        <p style="color: #666; line-height: 1.6;">
          안녕하세요, ${data.customerName}님.<br><br>
          주문번호 <strong>${data.orderId}</strong>의 ${data.isFullRefund ? '전액' : '부분'} 환불이 완료되었습니다.<br><br>
          <strong>환불 금액:</strong> ${formatCurrency(data.refundAmount, data.currency)}<br><br>
          환불 금액은 결제 수단에 따라 3-7 영업일 내에 반영됩니다.
        </p>
      </div>
    </body>
    </html>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `[VRD] 환불 완료 안내 - ${data.orderId}`,
      html: emailHtml,
    }),
  });
}

// ============================================
// Utility Functions
// ============================================

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'KRW') {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100); // Stripe stores in cents
}

function getBundleLabel(bundleType: string): string {
  const labels: Record<string, string> = {
    couple: '커플 번들 (25%)',
    crew: '크루 번들 (30%)',
    full_collection: '풀 컬렉션 (35%)',
  };
  return labels[bundleType] || '';
}

// ============================================
// Phase 53: Early Bird Sovereign Badge System
// ============================================

async function grantEarlyBirdSovereignBadge(
  customerEmail: string,
  orderId: string,
  supabase: ReturnType<typeof getSupabase>
) {
  // Find user by email
  const { data: userData } = await supabase
    .from('profiles')
    .select('user_id, badges')
    .eq('email', customerEmail)
    .single();

  // Also try auth.users table if not found in profiles
  let userId = userData?.user_id;

  if (!userId) {
    // Try to find user by email in profiles table directly
    const { data: profileByEmail } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', customerEmail)
      .maybeSingle();

    userId = profileByEmail?.user_id;
  }

  if (!userId) {
    console.log('[VRD Badge] No user found for email:', customerEmail);
    // Create a pending badge record for when user signs up
    await supabase.from('pending_badges').insert({
      email: customerEmail,
      badge_type: 'early_bird_sovereign',
      order_id: orderId,
      granted_at: new Date().toISOString(),
      metadata: {
        source: 'vrd_26ss_purchase',
        tier: 'Sovereign',
        benefits: ['APY +1.5%', 'Priority Support', 'Exclusive VRD Drops'],
      },
    });
    return;
  }

  // Update user profile with badge
  const existingBadges = userData?.badges || [];
  const newBadge = {
    type: 'early_bird_sovereign',
    name: 'Early Bird Sovereign',
    description: 'VRD 26SS First Purchaser - Automatic Sovereign Tier Upgrade',
    granted_at: new Date().toISOString(),
    order_id: orderId,
    benefits: {
      tier_upgrade: 'Sovereign',
      apy_bonus: 1.5,
      priority_support: true,
      exclusive_drops: true,
    },
  };

  // Check if badge already exists
  const hasBadge = existingBadges.some((b: { type: string }) => b.type === 'early_bird_sovereign');
  if (!hasBadge) {
    await supabase
      .from('profiles')
      .update({
        badges: [...existingBadges, newBadge],
        tier: 'Sovereign', // Automatic tier upgrade
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Log the badge grant
    await supabase.from('badge_grants').insert({
      user_id: userId,
      badge_type: 'early_bird_sovereign',
      order_id: orderId,
      granted_at: new Date().toISOString(),
    });
  }
}
