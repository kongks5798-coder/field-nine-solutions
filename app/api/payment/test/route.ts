/**
 * Payment System Test Endpoint
 * GET /api/payment/test
 *
 * Tests all payment endpoints in demo mode
 * Only works in development environment
 */

import { NextRequest, NextResponse } from 'next/server';
import { TOSS_SECRET_KEY, TOSS_CLIENT_KEY } from '@/lib/toss/client';
import { getPayPalClient } from '@/lib/payment/paypal';

export const runtime = 'nodejs';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: unknown;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 404 }
    );
  }

  const results: TestResult[] = [];
  const baseUrl = `http://localhost:${process.env.PORT || 3000}`;

  // ============================================
  // 1. Configuration Check
  // ============================================

  // Toss Configuration
  results.push({
    name: 'Toss Client Key',
    status: TOSS_CLIENT_KEY ? 'pass' : 'warn',
    message: TOSS_CLIENT_KEY ? 'Configured' : 'Not configured (demo mode)',
  });

  results.push({
    name: 'Toss Secret Key',
    status: TOSS_SECRET_KEY ? 'pass' : 'warn',
    message: TOSS_SECRET_KEY ? 'Configured' : 'Not configured (demo mode)',
  });

  // PayPal Configuration
  const paypal = getPayPalClient();
  results.push({
    name: 'PayPal Configuration',
    status: paypal.isConfigured ? 'pass' : 'warn',
    message: paypal.isConfigured
      ? `Configured (${paypal.isSandbox ? 'Sandbox' : 'Live'})`
      : 'Not configured (demo mode)',
  });

  // Supabase Configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  results.push({
    name: 'Supabase Configuration',
    status: supabaseUrl && supabaseServiceKey ? 'pass' : 'warn',
    message: supabaseUrl && supabaseServiceKey
      ? 'Configured'
      : 'Not fully configured - database features may be limited',
  });

  // ============================================
  // 2. API Endpoint Tests
  // ============================================

  // Test Toss Confirm endpoint
  try {
    const tossResponse = await fetch(`${baseUrl}/api/payment/toss/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentKey: 'test_pk_123',
        orderId: 'ORDER_TEST_123',
        amount: 10000,
      }),
    });
    const tossData = await tossResponse.json();

    results.push({
      name: 'Toss Confirm API',
      status: tossResponse.status === 401 ? 'pass' : 'warn',
      message: tossResponse.status === 401
        ? 'Endpoint active (auth required)'
        : `Status: ${tossResponse.status}`,
      details: tossData,
    });
  } catch (error) {
    results.push({
      name: 'Toss Confirm API',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Failed to connect',
    });
  }

  // Test Toss Cancel endpoint
  try {
    const cancelResponse = await fetch(`${baseUrl}/api/payment/toss/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentKey: 'test_pk_123',
        cancelReason: 'Test cancellation',
      }),
    });
    const cancelData = await cancelResponse.json();

    results.push({
      name: 'Toss Cancel API',
      status: cancelResponse.status === 401 ? 'pass' : 'warn',
      message: cancelResponse.status === 401
        ? 'Endpoint active (auth required)'
        : `Status: ${cancelResponse.status}`,
      details: cancelData,
    });
  } catch (error) {
    results.push({
      name: 'Toss Cancel API',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Failed to connect',
    });
  }

  // Test PayPal Create Order endpoint
  try {
    const paypalCreateResponse = await fetch(`${baseUrl}/api/payment/paypal/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 100,
        currency: 'USD',
        bookingType: 'flight',
        description: 'Test booking',
      }),
    });
    const paypalCreateData = await paypalCreateResponse.json();

    results.push({
      name: 'PayPal Create Order API',
      status: paypalCreateResponse.status === 401 ? 'pass' : 'warn',
      message: paypalCreateResponse.status === 401
        ? 'Endpoint active (auth required)'
        : `Status: ${paypalCreateResponse.status}`,
      details: paypalCreateData,
    });
  } catch (error) {
    results.push({
      name: 'PayPal Create Order API',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Failed to connect',
    });
  }

  // Test PayPal Capture Order endpoint
  try {
    const paypalCaptureResponse = await fetch(`${baseUrl}/api/payment/paypal/capture-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'DEMO-123',
        bookingType: 'hotel',
        bookingId: 'test-booking',
      }),
    });
    const paypalCaptureData = await paypalCaptureResponse.json();

    results.push({
      name: 'PayPal Capture Order API',
      status: paypalCaptureResponse.status === 401 ? 'pass' : 'warn',
      message: paypalCaptureResponse.status === 401
        ? 'Endpoint active (auth required)'
        : `Status: ${paypalCaptureResponse.status}`,
      details: paypalCaptureData,
    });
  } catch (error) {
    results.push({
      name: 'PayPal Capture Order API',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Failed to connect',
    });
  }

  // Test Toss Webhook endpoint
  try {
    const webhookResponse = await fetch(`${baseUrl}/api/payment/toss/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'PAYMENT_DONE',
        data: {
          paymentKey: 'test_pk',
          orderId: 'ORDER_TEST',
          status: 'DONE',
        },
      }),
    });
    const webhookData = await webhookResponse.json();

    results.push({
      name: 'Toss Webhook API',
      status: webhookResponse.status === 401 ? 'pass' : 'warn',
      message: webhookResponse.status === 401
        ? 'Endpoint active (signature required)'
        : `Status: ${webhookResponse.status}`,
      details: webhookData,
    });
  } catch (error) {
    results.push({
      name: 'Toss Webhook API',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Failed to connect',
    });
  }

  // ============================================
  // 3. Summary
  // ============================================

  const passed = results.filter((r) => r.status === 'pass').length;
  const warnings = results.filter((r) => r.status === 'warn').length;
  const failed = results.filter((r) => r.status === 'fail').length;

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    summary: {
      total: results.length,
      passed,
      warnings,
      failed,
    },
    results,
    nextSteps: [
      !TOSS_SECRET_KEY && 'Set TOSS_SECRET_KEY in .env for real Toss payments',
      !paypal.isConfigured && 'Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env for real PayPal payments',
      'Create a test user in Supabase and use their token for authenticated tests',
    ].filter(Boolean),
  });
}
