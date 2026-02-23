/**
 * ============================================
 * Field Nine OS: PayPal Webhook Setup Script
 * ============================================
 * Aesthetics: Tesla Style Code Base
 * Author: Jarvis (Field Nine CTO)
 * Date: 2026-01-24
 *
 * Usage: node scripts/setup-paypal-webhook.js
 * ============================================
 */

const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Field Nine Design System Constants
const WARM_IVORY = "#F9F9F7";
const DEEP_BLACK = "#171717";

// PayPal Configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.error('❌ PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set in .env.local');
  process.exit(1);
}
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

const PAYPAL_API_BASE = PAYPAL_MODE === 'live'
  ? 'api-m.paypal.com'
  : 'api-m.sandbox.paypal.com';

const WEBHOOK_URL = 'https://www.fieldnine.io/api/payment/paypal/webhook';

const WEBHOOK_EVENTS = [
  'PAYMENT.CAPTURE.COMPLETED',
  'PAYMENT.CAPTURE.DENIED',
  'PAYMENT.CAPTURE.REFUNDED',
  'CHECKOUT.ORDER.APPROVED',
  'CHECKOUT.ORDER.COMPLETED'
];

console.log('\n');
console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║        FIELD NINE OS: PAYPAL WEBHOOK SETUP v1.0                 ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log('║  Design System: WARM_IVORY ' + WARM_IVORY + ' | DEEP_BLACK ' + DEEP_BLACK + '  ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log('\n');

function httpsRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function getAccessToken() {
  console.log('[Step 1] Getting PayPal Access Token...\n');

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const options = {
    hostname: PAYPAL_API_BASE,
    port: 443,
    path: '/v1/oauth2/token',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  const result = await httpsRequest(options, 'grant_type=client_credentials');

  if (result.statusCode === 200 && result.data.access_token) {
    console.log('  ✅ Access Token obtained');
    console.log('  Mode: ' + PAYPAL_MODE.toUpperCase());
    return result.data.access_token;
  } else {
    console.log('  ❌ Failed to get access token');
    console.log('  Error:', JSON.stringify(result.data, null, 2));
    throw new Error('Failed to get PayPal access token');
  }
}

async function listWebhooks(accessToken) {
  console.log('\n[Step 2] Checking existing webhooks...\n');

  const options = {
    hostname: PAYPAL_API_BASE,
    port: 443,
    path: '/v1/notifications/webhooks',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  };

  const result = await httpsRequest(options);

  if (result.statusCode === 200) {
    const webhooks = result.data.webhooks || [];
    console.log(`  Found ${webhooks.length} existing webhook(s)`);

    // Check if our webhook URL already exists
    const existingWebhook = webhooks.find(w => w.url === WEBHOOK_URL);
    if (existingWebhook) {
      console.log('  ⚠️  Webhook already exists for this URL');
      console.log('  Webhook ID: ' + existingWebhook.id);
      return existingWebhook;
    }

    return null;
  } else {
    console.log('  ⚠️  Could not list webhooks:', result.data);
    return null;
  }
}

async function createWebhook(accessToken) {
  console.log('\n[Step 3] Creating new webhook...\n');

  const webhookData = {
    url: WEBHOOK_URL,
    event_types: WEBHOOK_EVENTS.map(name => ({ name }))
  };

  const postData = JSON.stringify(webhookData);

  const options = {
    hostname: PAYPAL_API_BASE,
    port: 443,
    path: '/v1/notifications/webhooks',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('  URL: ' + WEBHOOK_URL);
  console.log('  Events: ' + WEBHOOK_EVENTS.join(', '));

  const result = await httpsRequest(options, postData);

  if (result.statusCode === 201 || result.statusCode === 200) {
    console.log('\n  ✅ Webhook created successfully!');
    return result.data;
  } else {
    console.log('\n  ❌ Failed to create webhook');
    console.log('  Status:', result.statusCode);
    console.log('  Error:', JSON.stringify(result.data, null, 2));
    throw new Error('Failed to create webhook');
  }
}

async function main() {
  try {
    console.log('  PayPal Mode: ' + PAYPAL_MODE.toUpperCase());
    console.log('  API Base: ' + PAYPAL_API_BASE);
    console.log('  Webhook URL: ' + WEBHOOK_URL);
    console.log('');

    // Step 1: Get access token
    const accessToken = await getAccessToken();

    // Step 2: Check existing webhooks
    const existingWebhook = await listWebhooks(accessToken);

    let webhook;
    if (existingWebhook) {
      webhook = existingWebhook;
    } else {
      // Step 3: Create new webhook
      webhook = await createWebhook(accessToken);
    }

    // Success output
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                  WEBHOOK SETUP COMPLETE ✅                       ║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                  ║');
    console.log('║  Webhook ID: ' + webhook.id.padEnd(48) + '  ║');
    console.log('║                                                                  ║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║  다음 단계: Vercel에 PAYPAL_WEBHOOK_ID 환경변수 추가             ║');
    console.log('║                                                                  ║');
    console.log('║  vercel env add PAYPAL_WEBHOOK_ID production                     ║');
    console.log('║  → 입력: ' + webhook.id.padEnd(52) + '  ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('\n');

    // Return webhook ID for automation
    return webhook.id;

  } catch (error) {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                  WEBHOOK SETUP FAILED ❌                         ║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║  Error: ' + (error.message || 'Unknown error').substring(0, 54).padEnd(54) + '  ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('\n');
    process.exit(1);
  }
}

main();
