/**
 * Payment Notification Test Endpoint
 * POST /api/payment/test-notification
 *
 * Tests the notification system by simulating a payment event
 * Protected by admin secret
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendPaymentNotification,
  notifyPaymentSuccess,
} from '@/lib/notifications/payment-alerts';

export const runtime = 'nodejs';

// Admin secret for testing (use environment variable in production)
const TEST_SECRET = process.env.CRON_SECRET || 'test-secret';

export async function POST(request: NextRequest) {
  // Verify test secret
  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.replace('Bearer ', '');

  if (providedSecret !== TEST_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const testType = body.type || 'success';
    const testAmount = body.amount || 150000;
    const testCurrency = body.currency || 'KRW';

    let result;

    if (testType === 'full') {
      // Full notification test
      result = await sendPaymentNotification({
        type: 'success',
        provider: 'paypal',
        amount: testAmount,
        currency: testCurrency,
        orderId: `TEST-${Date.now()}`,
        bookingId: 'test-booking-001',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        paymentId: `PAYPAL-TEST-${Date.now()}`,
        timestamp: new Date(),
        metadata: {
          testMode: true,
          triggeredAt: new Date().toISOString(),
        },
      });
    } else {
      // Quick success notification
      result = await notifyPaymentSuccess('paypal', testAmount, testCurrency, {
        orderId: `TEST-${Date.now()}`,
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test notification sent',
      result,
      config: {
        slackConfigured: !!process.env.SLACK_WEBHOOK_URL,
        emailConfigured: !!process.env.RESEND_API_KEY,
        kakaoConfigured: !!(process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY && process.env.ADMIN_PHONE),
      },
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send test notification',
      },
      { status: 500 }
    );
  }
}
