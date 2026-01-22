/**
 * PayPal Create Order API
 * POST /api/payment/paypal/create-order
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayPalClient } from '@/lib/payment/paypal';
import { apiGuard, errorResponse } from '@/lib/security/api-guard';

export const runtime = 'nodejs';

interface CreateOrderRequest {
  amount: number;
  currency: string;
  description: string;
  bookingType: 'flight' | 'hotel';
  bookingId: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Security guard
    const guard = await apiGuard(request, {
      requireAuth: true,
      rateLimit: { maxRequests: 20, windowMs: 60000 },
    });

    if (!guard.passed) {
      return guard.response;
    }

    const { user, body } = guard;
    const data = body as unknown as CreateOrderRequest;

    // Validate
    if (!data.amount || !data.currency || !data.bookingType) {
      return errorResponse('Missing required fields: amount, currency, bookingType');
    }

    if (data.amount <= 0) {
      return errorResponse('Amount must be greater than 0');
    }

    const paypal = getPayPalClient();

    // Check if configured
    if (!paypal.isConfigured) {
      // Return demo response for testing
      return NextResponse.json({
        success: true,
        orderId: `DEMO-${Date.now()}`,
        approvalUrl: null,
        source: 'demo',
        note: 'PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.',
      });
    }

    // Create PayPal order
    const referenceId = `${data.bookingType}-${data.bookingId || Date.now()}-${user?.id || 'guest'}`;

    const result = await paypal.createOrder({
      amount: data.amount,
      currency: data.currency,
      description: data.description || `K-Universal ${data.bookingType} booking`,
      referenceId,
      returnUrl: data.returnUrl,
      cancelUrl: data.cancelUrl,
    });

    if (!result.success || !result.order) {
      return errorResponse(result.error || 'Failed to create PayPal order', 500);
    }

    // Find approval URL
    const approvalUrl = result.order.links.find((link) => link.rel === 'payer-action')?.href
      || result.order.links.find((link) => link.rel === 'approve')?.href;

    return NextResponse.json({
      success: true,
      orderId: result.order.id,
      status: result.order.status,
      approvalUrl,
      source: paypal.isSandbox ? 'sandbox' : 'live',
    });
  } catch (error) {
    console.error('PayPal create order error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      },
      { status: 500 }
    );
  }
}
