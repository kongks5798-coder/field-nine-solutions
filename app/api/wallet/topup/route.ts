/**
 * K-UNIVERSAL Ghost Wallet Top-up API
 * Stripe Payment Intent creation endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe/client';

export const runtime = 'nodejs';

interface TopupRequest {
  amount: number; // in dollars (e.g., 10.00)
  currency?: string;
  userId: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: TopupRequest = await request.json();

    // Validation
    if (!body.amount || body.amount < 1) {
      return NextResponse.json(
        { success: false, error: 'Amount must be at least $1' },
        { status: 400 }
      );
    }

    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Convert dollars to cents for Stripe
    const amountInCents = Math.round(body.amount * 100);

    // Create Payment Intent
    const result = await createPaymentIntent({
      amount: amountInCents,
      currency: body.currency || 'usd',
      userId: body.userId,
      description: `Ghost Wallet Top-up: $${body.amount}`,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    });
  } catch (error) {
    console.error('Topup API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
