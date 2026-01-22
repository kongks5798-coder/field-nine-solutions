/**
 * PayPal Capture Order API
 * POST /api/payment/paypal/capture-order
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayPalClient } from '@/lib/payment/paypal';
import { supabaseAdmin } from '@/lib/supabase/server';
import { apiGuard, errorResponse } from '@/lib/security/api-guard';

export const runtime = 'nodejs';

interface CaptureOrderRequest {
  orderId: string;
  bookingType: 'flight' | 'hotel';
  bookingId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Security guard
    const guard = await apiGuard(request, {
      requireAuth: true,
      rateLimit: { maxRequests: 10, windowMs: 60000 },
    });

    if (!guard.passed) {
      return guard.response;
    }

    const { user, body } = guard;
    const data = body as unknown as CaptureOrderRequest;

    // Validate
    if (!data.orderId) {
      return errorResponse('Missing orderId');
    }

    const paypal = getPayPalClient();

    // Check if configured
    if (!paypal.isConfigured) {
      // Return demo response
      return NextResponse.json({
        success: true,
        captureId: `DEMO-CAPTURE-${Date.now()}`,
        status: 'COMPLETED',
        source: 'demo',
        note: 'PayPal demo mode - no actual payment processed',
      });
    }

    // Capture the payment
    const result = await paypal.captureOrder(data.orderId);

    if (!result.success || !result.capture) {
      return errorResponse(result.error || 'Failed to capture payment', 500);
    }

    const capture = result.capture;
    const captureDetails = capture.purchase_units[0]?.payments?.captures[0];

    if (!captureDetails) {
      return errorResponse('No capture details found', 500);
    }

    // Record transaction in database
    const userId = user?.id || 'demo-user';

    try {
      await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        type: 'payment',
        amount: -parseFloat(captureDetails.amount.value),
        currency: captureDetails.amount.currency_code,
        status: 'completed',
        description: `PayPal payment for ${data.bookingType} booking`,
        merchant_name: 'K-Universal',
        merchant_category: 'travel',
        reference_id: data.bookingId || data.orderId,
        metadata: {
          paypal_order_id: data.orderId,
          paypal_capture_id: captureDetails.id,
          payer_email: capture.payer?.email_address,
          payer_id: capture.payer?.payer_id,
        },
      });
    } catch (dbError) {
      console.warn('Failed to record PayPal transaction:', dbError);
    }

    // Update booking payment status if bookingId provided
    if (data.bookingId) {
      try {
        await supabaseAdmin
          .from('bookings')
          .update({
            payment_status: 'paid',
            payment_method: 'paypal',
            payment_reference: captureDetails.id,
            paid_at: new Date().toISOString(),
          })
          .eq('id', data.bookingId)
          .eq('user_id', userId);
      } catch (updateError) {
        console.warn('Failed to update booking payment status:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      captureId: captureDetails.id,
      status: capture.status,
      amount: captureDetails.amount,
      payer: {
        email: capture.payer?.email_address,
        name: capture.payer?.name
          ? `${capture.payer.name.given_name} ${capture.payer.name.surname}`
          : undefined,
      },
      source: paypal.isSandbox ? 'sandbox' : 'live',
    });
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to capture payment',
      },
      { status: 500 }
    );
  }
}
