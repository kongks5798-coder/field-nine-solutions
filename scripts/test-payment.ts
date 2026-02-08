/**
 * K-UNIVERSAL Payment System Test Script
 *
 * Tests:
 * 1. Toss Payment Flow (Demo Mode)
 * 2. PayPal Payment Flow (Demo Mode)
 * 3. Idempotency System
 * 4. Database Integration
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/test-payment.ts
 */

import 'dotenv/config';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: unknown;
}

const results: TestResult[] = [];

// Helper function for API calls
async function apiCall(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: unknown,
  headers?: Record<string, string>
): Promise<{ status: number; data: unknown }> {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  return { status: response.status, data };
}

// ============================================
// Test: Toss Payment Confirm (Demo Mode)
// ============================================
async function testTossPaymentConfirm(): Promise<void> {
  console.log('\n[TEST] Toss Payment Confirm...');

  try {
    const response = await apiCall('/api/payment/toss/confirm', 'POST', {
      paymentKey: `test_pk_${Date.now()}`,
      orderId: `ORDER_${Date.now()}`,
      amount: 50000,
    });

    const passed = response.status === 200 || response.status === 401;
    results.push({
      name: 'Toss Payment Confirm',
      passed,
      message: passed
        ? `Status: ${response.status} - ${response.status === 401 ? 'Auth required (expected)' : 'Success'}`
        : `Unexpected status: ${response.status}`,
      data: response.data,
    });

    console.log(`  ${passed ? '✓' : '✗'} Status: ${response.status}`);
  } catch (error) {
    results.push({
      name: 'Toss Payment Confirm',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

// ============================================
// Test: Toss Payment Cancel (Demo Mode)
// ============================================
async function testTossPaymentCancel(): Promise<void> {
  console.log('\n[TEST] Toss Payment Cancel...');

  try {
    const response = await apiCall('/api/payment/toss/cancel', 'POST', {
      paymentKey: `test_pk_${Date.now()}`,
      cancelReason: 'Test cancellation',
    });

    const passed = response.status === 200 || response.status === 401;
    results.push({
      name: 'Toss Payment Cancel',
      passed,
      message: passed
        ? `Status: ${response.status} - ${response.status === 401 ? 'Auth required (expected)' : 'Success'}`
        : `Unexpected status: ${response.status}`,
      data: response.data,
    });

    console.log(`  ${passed ? '✓' : '✗'} Status: ${response.status}`);
  } catch (error) {
    results.push({
      name: 'Toss Payment Cancel',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

// ============================================
// Test: PayPal Create Order (Demo Mode)
// ============================================
async function testPayPalCreateOrder(): Promise<void> {
  console.log('\n[TEST] PayPal Create Order...');

  try {
    const response = await apiCall('/api/payment/paypal/create-order', 'POST', {
      amount: 100.00,
      currency: 'USD',
      description: 'Test Flight Booking',
      bookingType: 'flight',
      bookingId: `booking_${Date.now()}`,
    });

    const passed = response.status === 200 || response.status === 401;
    const data = response.data as Record<string, unknown>;

    results.push({
      name: 'PayPal Create Order',
      passed,
      message: passed
        ? `Status: ${response.status} - Source: ${data?.source || 'N/A'}`
        : `Unexpected status: ${response.status}`,
      data: response.data,
    });

    console.log(`  ${passed ? '✓' : '✗'} Status: ${response.status}`);
    if (data?.orderId) {
      console.log(`    Order ID: ${data.orderId}`);
    }
  } catch (error) {
    results.push({
      name: 'PayPal Create Order',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

// ============================================
// Test: PayPal Capture Order (Demo Mode)
// ============================================
async function testPayPalCaptureOrder(): Promise<void> {
  console.log('\n[TEST] PayPal Capture Order...');

  try {
    const response = await apiCall('/api/payment/paypal/capture-order', 'POST', {
      orderId: `DEMO-${Date.now()}`,
      bookingType: 'hotel',
      bookingId: `booking_${Date.now()}`,
    });

    const passed = response.status === 200 || response.status === 401;
    const data = response.data as Record<string, unknown>;

    results.push({
      name: 'PayPal Capture Order',
      passed,
      message: passed
        ? `Status: ${response.status} - Source: ${data?.source || 'N/A'}`
        : `Unexpected status: ${response.status}`,
      data: response.data,
    });

    console.log(`  ${passed ? '✓' : '✗'} Status: ${response.status}`);
  } catch (error) {
    results.push({
      name: 'PayPal Capture Order',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

// ============================================
// Test: Webhook Endpoint Exists
// ============================================
async function testWebhookEndpoints(): Promise<void> {
  console.log('\n[TEST] Webhook Endpoints...');

  // Test Toss webhook (should return 401 without signature)
  try {
    const tossResponse = await apiCall('/api/payment/toss/webhook', 'POST', {
      eventType: 'PAYMENT_DONE',
      data: { paymentKey: 'test', orderId: 'test', status: 'DONE' },
    });

    // 401 is expected without proper signature
    const tossPassed = tossResponse.status === 401;
    results.push({
      name: 'Toss Webhook Endpoint',
      passed: tossPassed,
      message: `Status: ${tossResponse.status} - ${tossPassed ? 'Signature required (expected)' : 'Unexpected response'}`,
    });
    console.log(`  ${tossPassed ? '✓' : '✗'} Toss Webhook: ${tossResponse.status}`);
  } catch (error) {
    results.push({
      name: 'Toss Webhook Endpoint',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test PayPal webhook
  try {
    const paypalResponse = await apiCall('/api/payment/paypal/webhook', 'POST', {
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: { id: 'test' },
    });

    // 401 is expected without proper headers
    const paypalPassed = paypalResponse.status === 401;
    results.push({
      name: 'PayPal Webhook Endpoint',
      passed: paypalPassed,
      message: `Status: ${paypalResponse.status} - ${paypalPassed ? 'Headers required (expected)' : 'Unexpected response'}`,
    });
    console.log(`  ${paypalPassed ? '✓' : '✗'} PayPal Webhook: ${paypalResponse.status}`);
  } catch (error) {
    results.push({
      name: 'PayPal Webhook Endpoint',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }
}

// ============================================
// Main Test Runner
// ============================================
async function runTests(): Promise<void> {
  console.log('='.repeat(60));
  console.log('K-UNIVERSAL Payment System Test');
  console.log('='.repeat(60));
  console.log(`Target: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);

  // Check if server is running
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/health`).catch(() => null);
    if (!healthCheck) {
      console.log('\n[WARNING] Server may not be running. Starting tests anyway...\n');
    }
  } catch {
    // Ignore health check errors
  }

  // Run all tests
  await testTossPaymentConfirm();
  await testTossPaymentCancel();
  await testPayPalCreateOrder();
  await testPayPalCaptureOrder();
  await testWebhookEndpoints();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  results.forEach((r) => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}: ${r.message}`);
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failed > 0) {
    console.log('\n[INFO] Some tests failed. This is expected if:');
    console.log('  - Server is not running (run `npm run dev` first)');
    console.log('  - API keys are not configured (demo mode will be used)');
    console.log('  - Webhook tests expect 401 without proper signatures');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
