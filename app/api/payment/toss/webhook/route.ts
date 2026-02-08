/**
 * Toss Payments Webhook Handler
 * POST /api/payment/toss/webhook
 *
 * STATUS: DISABLED - Toss payments will be enabled after revenue milestone
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  // Return 200 OK to prevent Toss from retrying
  return NextResponse.json(
    {
      success: true,
      message: 'Toss webhook received but service is currently disabled',
      code: 'TOSS_DISABLED',
    },
    { status: 200 }
  );
}
