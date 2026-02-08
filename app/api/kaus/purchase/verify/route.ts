/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 54: PAYPAL PAYMENT VERIFICATION & KAUS GRANT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * CRITICAL: This endpoint captures PayPal payment and grants KAUS coins
 * Called after user approves payment on PayPal
 *
 * Flow:
 * 1. User approves payment on PayPal
 * 2. PayPal redirects to this endpoint with order ID
 * 3. We capture the payment
 * 4. We grant KAUS to user (server-side only)
 *
 * Security:
 * - PayPal order verification
 * - Double-spend prevention
 * - SHA-256 audit logging
 *
 * @route GET /api/kaus/purchase/verify?ref=KAUS-xxx&token=xxx&PayerID=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayPalClient } from '@/lib/payment/paypal';
import { completePurchase, toFinancialPrecision } from '@/lib/payment/kaus-purchase';
import { auditLogger } from '@/lib/audit/logger';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE ADMIN CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET: PayPal Return URL Handler
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const referenceId = searchParams.get('ref');
  const paypalToken = searchParams.get('token'); // PayPal order ID
  const payerId = searchParams.get('PayerID');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://m.fieldnine.io';

  // Validate required parameters
  if (!referenceId || !paypalToken) {
    return NextResponse.redirect(
      `${appUrl}/ko/nexus/exchange?error=missing_params&code=INVALID_CALLBACK`
    );
  }

  try {
    const paypal = getPayPalClient();
    const supabase = getSupabaseAdmin();

    if (!paypal.isConfigured) {
      await auditLogger.log({
        eventType: 'KAUS_PURCHASE',
        userId: 'UNKNOWN',
        status: 'FAILED',
        details: {
          referenceId,
          error: 'PayPal not configured',
        },
      });

      return NextResponse.redirect(
        `${appUrl}/ko/nexus/exchange?error=gateway_error&code=PAYPAL_UNAVAILABLE`
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Get pending order from database
    // ═══════════════════════════════════════════════════════════════════════════

    let pendingOrder: {
      user_id: string;
      package_id: string;
      kaus_amount: number;
      bonus_amount: number;
      total_kaus: number;
      currency: string;
      status: string;
    } | null = null;

    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('kaus_orders')
        .select('*')
        .eq('reference_id', referenceId)
        .single();

      pendingOrder = data;
    }

    // If no database record, try to get info from PayPal order
    if (!pendingOrder) {
      const orderResult = await paypal.getOrder(paypalToken);

      if (!orderResult.success || !orderResult.order) {
        return NextResponse.redirect(
          `${appUrl}/ko/nexus/exchange?error=order_not_found&code=ORDER_MISSING`
        );
      }

      // Parse order details from PayPal
      const order = orderResult.order;
      const purchaseUnit = order.purchase_units[0];
      const amount = parseFloat(purchaseUnit.amount.value);

      // Calculate KAUS from amount (simplified - in production, match against packages)
      const kausAmount = calculateKausFromPayment(amount, purchaseUnit.amount.currency_code);

      pendingOrder = {
        user_id: 'anonymous', // Will need to be resolved
        package_id: 'custom',
        kaus_amount: kausAmount,
        bonus_amount: 0,
        total_kaus: kausAmount,
        currency: purchaseUnit.amount.currency_code,
        status: 'PENDING',
      };
    }

    // Check if already processed
    if (pendingOrder.status === 'COMPLETED') {
      return NextResponse.redirect(
        `${appUrl}/ko/nexus/exchange?success=true&already_processed=true`
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Capture the PayPal payment
    // ═══════════════════════════════════════════════════════════════════════════

    const captureResult = await paypal.captureOrder(paypalToken);

    if (!captureResult.success || !captureResult.capture) {
      await auditLogger.log({
        eventType: 'KAUS_PURCHASE',
        userId: pendingOrder.user_id,
        amount: pendingOrder.total_kaus,
        currency: pendingOrder.currency,
        status: 'FAILED',
        details: {
          referenceId,
          paypalOrderId: paypalToken,
          error: captureResult.error || 'Capture failed',
        },
      });

      return NextResponse.redirect(
        `${appUrl}/ko/nexus/exchange?error=capture_failed&code=PAYMENT_FAILED`
      );
    }

    const capture = captureResult.capture;
    const captureId = capture.purchase_units[0]?.payments?.captures?.[0]?.id;
    const payerEmail = capture.payer?.email_address;

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: Grant KAUS coins via completePurchase
    // ═══════════════════════════════════════════════════════════════════════════

    const purchaseResult = await completePurchase(
      pendingOrder.user_id,
      referenceId,
      pendingOrder.total_kaus,
      captureId || paypalToken // Payment verification ID
    );

    if (!purchaseResult.success) {
      // Payment captured but balance update failed - CRITICAL ERROR
      await auditLogger.log({
        eventType: 'SECURITY_INCIDENT',
        userId: pendingOrder.user_id,
        status: 'FAILED',
        details: {
          type: 'PAYMENT_CAPTURED_BUT_GRANT_FAILED',
          referenceId,
          paypalOrderId: paypalToken,
          captureId,
          totalKaus: pendingOrder.total_kaus,
          error: purchaseResult.error,
          requiresManualIntervention: true,
        },
      });

      // Still redirect to success but with warning
      return NextResponse.redirect(
        `${appUrl}/ko/nexus/exchange?success=pending&ref=${referenceId}&message=processing`
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: Update order status
    // ═══════════════════════════════════════════════════════════════════════════

    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('kaus_orders')
        .update({
          status: 'COMPLETED',
          paypal_order_id: paypalToken,
          paypal_capture_id: captureId,
          payer_email: payerEmail,
          completed_at: new Date().toISOString(),
          transaction_id: purchaseResult.transactionId,
        })
        .eq('reference_id', referenceId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: Log success and redirect
    // ═══════════════════════════════════════════════════════════════════════════

    await auditLogger.log({
      eventType: 'KAUS_PURCHASE',
      userId: pendingOrder.user_id,
      amount: pendingOrder.total_kaus,
      currency: 'KAUS',
      status: 'SUCCESS',
      details: {
        referenceId,
        paypalOrderId: paypalToken,
        captureId,
        payerEmail,
        baseAmount: pendingOrder.kaus_amount,
        bonusAmount: pendingOrder.bonus_amount,
        totalKaus: pendingOrder.total_kaus,
        newBalance: purchaseResult.newBalance,
        transactionId: purchaseResult.transactionId,
      },
    });

    // Redirect to success page
    const successUrl = new URL(`${appUrl}/ko/nexus/exchange`);
    successUrl.searchParams.set('success', 'true');
    successUrl.searchParams.set('kaus', pendingOrder.total_kaus.toString());
    successUrl.searchParams.set('ref', referenceId);

    return NextResponse.redirect(successUrl.toString());

  } catch (error) {
    console.error('[KAUS Purchase Verify] Critical Error:', error);

    await auditLogger.log({
      eventType: 'KAUS_PURCHASE',
      userId: 'UNKNOWN',
      status: 'FAILED',
      details: {
        referenceId,
        paypalToken,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.redirect(
      `${appUrl}/ko/nexus/exchange?error=system_error&code=INTERNAL_ERROR`
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateKausFromPayment(amount: number, currency: string): number {
  // KAUS prices
  const KAUS_PRICE_USD = 0.09;
  const KAUS_PRICE_KRW = 120;

  if (currency === 'KRW') {
    return toFinancialPrecision(amount / KAUS_PRICE_KRW);
  }

  // Default to USD
  return toFinancialPrecision(amount / KAUS_PRICE_USD);
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST: Manual verification (for webhook fallback)
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paypalOrderId, referenceId, userId } = body;

    if (!paypalOrderId || !referenceId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
      }, { status: 400 });
    }

    const paypal = getPayPalClient();

    if (!paypal.isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Payment gateway unavailable',
      }, { status: 503 });
    }

    // Get order status
    const orderResult = await paypal.getOrder(paypalOrderId);

    if (!orderResult.success || !orderResult.order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
      }, { status: 404 });
    }

    const order = orderResult.order;

    if (order.status !== 'COMPLETED' && order.status !== 'APPROVED') {
      return NextResponse.json({
        success: false,
        error: `Order not ready for capture. Status: ${order.status}`,
        status: order.status,
      }, { status: 400 });
    }

    // If approved but not captured, capture now
    if (order.status === 'APPROVED') {
      const captureResult = await paypal.captureOrder(paypalOrderId);

      if (!captureResult.success) {
        return NextResponse.json({
          success: false,
          error: captureResult.error || 'Capture failed',
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified. KAUS will be credited.',
      orderId: paypalOrderId,
      referenceId,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
