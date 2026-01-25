/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 54: KAUS PAYMENT WEBHOOK HANDLER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Unified handler for KAUS purchase webhooks from PayPal and Toss
 * Called when payment is captured/confirmed
 *
 * Security:
 * - Double-spend prevention via payment verification ID
 * - SHA-256 audit logging
 * - 8-decimal financial precision
 */

import { createClient } from '@supabase/supabase-js';
import { completePurchase, toFinancialPrecision, KAUS_PRICE_KRW, KAUS_PRICE_USD } from './kaus-purchase';
import { auditLogger } from '@/lib/audit/logger';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface KausPaymentEvent {
  provider: 'paypal' | 'toss';
  paymentId: string;          // PayPal capture ID or Toss paymentKey
  referenceId: string;        // Our order reference (KAUS-xxx)
  amount: number;
  currency: 'KRW' | 'USD';
  payerEmail?: string;
  payerId?: string;
  metadata?: Record<string, unknown>;
}

export interface KausWebhookResult {
  success: boolean;
  alreadyProcessed?: boolean;
  kausGranted?: number;
  newBalance?: number;
  transactionId?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK IF KAUS ORDER
// ═══════════════════════════════════════════════════════════════════════════════

export function isKausOrder(referenceId: string): boolean {
  return referenceId?.startsWith('KAUS-') ?? false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESS KAUS PAYMENT
// ═══════════════════════════════════════════════════════════════════════════════

export async function processKausPayment(event: KausPaymentEvent): Promise<KausWebhookResult> {
  const supabase = getSupabaseAdmin();

  console.log('[KAUS Webhook] Processing payment:', {
    provider: event.provider,
    referenceId: event.referenceId,
    amount: event.amount,
    currency: event.currency,
  });

  try {
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Check for duplicate processing
    // ═══════════════════════════════════════════════════════════════════════════

    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingTx } = await (supabase as any)
        .from('transactions')
        .select('id')
        .eq('payment_verification_id', event.paymentId)
        .single();

      if (existingTx) {
        console.log('[KAUS Webhook] Payment already processed:', event.paymentId);
        return {
          success: true,
          alreadyProcessed: true,
        };
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Find the pending KAUS order
    // ═══════════════════════════════════════════════════════════════════════════

    let orderData: {
      user_id: string;
      total_kaus: number;
      status: string;
    } | null = null;

    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('kaus_orders')
        .select('user_id, total_kaus, status')
        .eq('reference_id', event.referenceId)
        .single();

      orderData = data;
    }

    // If no order found, calculate KAUS from payment amount
    if (!orderData) {
      const kausAmount = calculateKausFromFiat(event.amount, event.currency);
      orderData = {
        user_id: 'webhook-user', // Fallback - should be resolved from order
        total_kaus: kausAmount,
        status: 'PENDING',
      };

      console.warn('[KAUS Webhook] Order not found, using calculated amount:', {
        referenceId: event.referenceId,
        calculatedKaus: kausAmount,
      });
    }

    // Check if already completed
    if (orderData.status === 'COMPLETED') {
      return {
        success: true,
        alreadyProcessed: true,
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: Grant KAUS coins
    // ═══════════════════════════════════════════════════════════════════════════

    const purchaseResult = await completePurchase(
      orderData.user_id,
      event.referenceId,
      orderData.total_kaus,
      event.paymentId
    );

    if (!purchaseResult.success) {
      // Log critical error
      await auditLogger.log({
        eventType: 'SECURITY_INCIDENT',
        userId: orderData.user_id,
        status: 'FAILED',
        details: {
          type: 'WEBHOOK_GRANT_FAILED',
          provider: event.provider,
          referenceId: event.referenceId,
          paymentId: event.paymentId,
          totalKaus: orderData.total_kaus,
          error: purchaseResult.error,
          requiresManualIntervention: true,
        },
      });

      return {
        success: false,
        error: purchaseResult.error || 'Failed to grant KAUS',
      };
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
          payment_provider: event.provider,
          payment_id: event.paymentId,
          payer_email: event.payerEmail,
          completed_at: new Date().toISOString(),
          transaction_id: purchaseResult.transactionId,
        })
        .eq('reference_id', event.referenceId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: Log success
    // ═══════════════════════════════════════════════════════════════════════════

    await auditLogger.log({
      eventType: 'KAUS_PURCHASE',
      userId: orderData.user_id,
      amount: orderData.total_kaus,
      currency: 'KAUS',
      status: 'SUCCESS',
      details: {
        provider: event.provider,
        referenceId: event.referenceId,
        paymentId: event.paymentId,
        payerEmail: event.payerEmail,
        totalKaus: orderData.total_kaus,
        newBalance: purchaseResult.newBalance,
        transactionId: purchaseResult.transactionId,
        processedViaWebhook: true,
      },
    });

    console.log('[KAUS Webhook] Payment processed successfully:', {
      referenceId: event.referenceId,
      kausGranted: orderData.total_kaus,
      newBalance: purchaseResult.newBalance,
    });

    return {
      success: true,
      kausGranted: orderData.total_kaus,
      newBalance: purchaseResult.newBalance,
      transactionId: purchaseResult.transactionId,
    };

  } catch (error) {
    console.error('[KAUS Webhook] Critical error:', error);

    await auditLogger.log({
      eventType: 'KAUS_PURCHASE',
      userId: 'UNKNOWN',
      status: 'FAILED',
      details: {
        provider: event.provider,
        referenceId: event.referenceId,
        paymentId: event.paymentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateKausFromFiat(amount: number, currency: 'KRW' | 'USD'): number {
  const rate = currency === 'KRW' ? KAUS_PRICE_KRW : KAUS_PRICE_USD;
  return toFinancialPrecision(amount / rate);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYPAL SPECIFIC HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export async function handlePayPalKausPayment(
  captureId: string,
  referenceId: string,
  amount: number,
  currency: string,
  payerEmail?: string
): Promise<KausWebhookResult> {
  return processKausPayment({
    provider: 'paypal',
    paymentId: captureId,
    referenceId,
    amount,
    currency: currency === 'KRW' ? 'KRW' : 'USD',
    payerEmail,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOSS SPECIFIC HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export async function handleTossKausPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
  customerEmail?: string
): Promise<KausWebhookResult> {
  return processKausPayment({
    provider: 'toss',
    paymentId: paymentKey,
    referenceId: orderId,
    amount,
    currency: 'KRW',
    payerEmail: customerEmail,
  });
}
