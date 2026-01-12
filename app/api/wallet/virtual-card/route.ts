/**
 * K-UNIVERSAL Virtual Card Generation API
 * Create virtual cards for domestic merchant payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createVirtualCard } from '@/lib/wallet/virtual-card';

export const runtime = 'nodejs';

interface VirtualCardRequest {
  userId: string;
  cardholderName: string;
  initialBalance: number;
  currency?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: VirtualCardRequest = await request.json();

    // Validation
    if (!body.userId || !body.cardholderName) {
      return NextResponse.json(
        { success: false, error: 'User ID and cardholder name are required' },
        { status: 400 }
      );
    }

    if (!body.initialBalance || body.initialBalance < 0) {
      return NextResponse.json(
        { success: false, error: 'Initial balance must be positive' },
        { status: 400 }
      );
    }

    // Create virtual card
    const result = await createVirtualCard({
      userId: body.userId,
      cardholderName: body.cardholderName,
      initialBalance: body.initialBalance,
      currency: body.currency || 'KRW',
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      card: result.card,
    });
  } catch (error) {
    console.error('Virtual card API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Production: Fetch user's virtual cards from database
    // For now, return empty array
    return NextResponse.json({
      success: true,
      cards: [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
