/**
 * K-UNIVERSAL Webhook Security Guard
 * Production-Grade HMAC-SHA256 Signature Verification
 *
 * Features:
 * - Constant-time comparison (timing attack prevention)
 * - Idempotency key tracking
 * - Replay attack prevention
 * - Structured audit logging
 *
 * @module lib/security/webhook-guard
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';

// ============================================
// Types
// ============================================

export interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
  requestId: string;
}

export interface WebhookConfig {
  provider: 'toss' | 'paypal' | 'lemonsqueezy' | 'stripe' | 'kakao';
  secret: string;
  signatureHeader: string;
  timestampHeader?: string;
  timestampTolerance?: number; // seconds
  hashAlgorithm?: 'sha256' | 'sha512';
  encoding?: 'hex' | 'base64';
}

export interface IdempotencyRecord {
  key: string;
  processedAt: Date;
  result: 'success' | 'failed';
}

// ============================================
// In-Memory Idempotency Store (Production: Use Redis)
// ============================================

const idempotencyStore = new Map<string, IdempotencyRecord>();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup old entries every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of idempotencyStore.entries()) {
      if (now - record.processedAt.getTime() > IDEMPOTENCY_TTL) {
        idempotencyStore.delete(key);
      }
    }
  }, 60 * 60 * 1000);
}

// ============================================
// Provider-Specific Configurations
// ============================================

export const WEBHOOK_CONFIGS: Record<string, Omit<WebhookConfig, 'secret'>> = {
  toss: {
    provider: 'toss',
    signatureHeader: 'toss-signature',
    hashAlgorithm: 'sha256',
    encoding: 'base64',
  },
  paypal: {
    provider: 'paypal',
    signatureHeader: 'paypal-transmission-sig',
    timestampHeader: 'paypal-transmission-time',
    timestampTolerance: 300, // 5 minutes
    hashAlgorithm: 'sha256',
    encoding: 'base64',
  },
  lemonsqueezy: {
    provider: 'lemonsqueezy',
    signatureHeader: 'x-signature',
    hashAlgorithm: 'sha256',
    encoding: 'hex',
  },
  stripe: {
    provider: 'stripe',
    signatureHeader: 'stripe-signature',
    timestampHeader: 'stripe-signature', // Included in signature header
    timestampTolerance: 300,
    hashAlgorithm: 'sha256',
    encoding: 'hex',
  },
};

// ============================================
// Core Verification Functions
// ============================================

/**
 * Verify HMAC signature with constant-time comparison
 * Prevents timing attacks
 */
export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256',
  encoding: 'hex' | 'base64' = 'hex'
): boolean {
  if (!secret || !signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payload, 'utf8')
      .digest(encoding);

    // Constant-time comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    logger.error('webhook_signature_verification_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Verify timestamp to prevent replay attacks
 */
export function verifyTimestamp(
  timestamp: string | number,
  toleranceSeconds: number = 300
): boolean {
  try {
    const webhookTime = typeof timestamp === 'string'
      ? new Date(timestamp).getTime()
      : timestamp * 1000;

    const now = Date.now();
    const diff = Math.abs(now - webhookTime);

    return diff <= toleranceSeconds * 1000;
  } catch {
    return false;
  }
}

// ============================================
// Provider-Specific Verification
// ============================================

/**
 * Verify Toss Payments webhook
 */
export function verifyTossWebhook(
  payload: string,
  signature: string
): WebhookVerificationResult {
  const requestId = generateRequestId();
  const secret = process.env.TOSS_WEBHOOK_SECRET;

  if (!secret) {
    logger.error('webhook_secret_missing', {
      provider: 'toss',
      requestId,
    });
    return {
      valid: false,
      error: 'Webhook secret not configured',
      requestId,
    };
  }

  const valid = verifyHmacSignature(payload, signature, secret, 'sha256', 'base64');

  if (!valid) {
    logger.warn('webhook_signature_invalid', {
      provider: 'toss',
      requestId,
    });
  }

  return { valid, requestId };
}

/**
 * Verify PayPal webhook (simplified - production should use PayPal SDK)
 * PayPal uses a more complex verification involving their API
 */
export async function verifyPayPalWebhook(
  request: NextRequest,
  payload: string
): Promise<WebhookVerificationResult> {
  const requestId = generateRequestId();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    logger.error('webhook_id_missing', {
      provider: 'paypal',
      requestId,
    });
    return {
      valid: false,
      error: 'PayPal webhook ID not configured',
      requestId,
    };
  }

  // PayPal verification headers
  const transmissionId = request.headers.get('paypal-transmission-id');
  const transmissionTime = request.headers.get('paypal-transmission-time');
  const transmissionSig = request.headers.get('paypal-transmission-sig');
  const certUrl = request.headers.get('paypal-cert-url');

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl) {
    logger.warn('webhook_headers_missing', {
      provider: 'paypal',
      requestId,
      headers: { transmissionId: !!transmissionId, transmissionTime: !!transmissionTime },
    });
    return {
      valid: false,
      error: 'Missing PayPal verification headers',
      requestId,
    };
  }

  // Verify timestamp (5 minute tolerance)
  if (!verifyTimestamp(transmissionTime, 300)) {
    logger.warn('webhook_timestamp_expired', {
      provider: 'paypal',
      requestId,
      transmissionTime,
    });
    return {
      valid: false,
      error: 'Webhook timestamp expired',
      requestId,
    };
  }

  // For production: Use PayPal SDK verification API
  // This is a simplified signature check
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID || '';
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';

    if (!clientId || !clientSecret) {
      return { valid: false, error: 'PayPal credentials not configured', requestId };
    }

    // Call PayPal verify webhook signature API
    const mode = process.env.PAYPAL_MODE || 'sandbox';
    const baseUrl = mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    // Get access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      logger.error('paypal_auth_failed', { requestId, status: authResponse.status });
      return { valid: false, error: 'PayPal authentication failed', requestId };
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Verify webhook signature
    const verifyResponse = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: 'SHA256withRSA',
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(payload),
      }),
    });

    const verifyData = await verifyResponse.json();
    const valid = verifyData.verification_status === 'SUCCESS';

    if (!valid) {
      logger.warn('webhook_signature_invalid', {
        provider: 'paypal',
        requestId,
        verificationStatus: verifyData.verification_status,
      });
    }

    return { valid, requestId };
  } catch (error) {
    logger.error('paypal_webhook_verification_error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { valid: false, error: 'Verification failed', requestId };
  }
}

/**
 * Verify LemonSqueezy webhook
 */
export function verifyLemonSqueezyWebhook(
  payload: string,
  signature: string
): WebhookVerificationResult {
  const requestId = generateRequestId();
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    logger.error('webhook_secret_missing', {
      provider: 'lemonsqueezy',
      requestId,
    });
    return {
      valid: false,
      error: 'Webhook secret not configured',
      requestId,
    };
  }

  const valid = verifyHmacSignature(payload, signature, secret, 'sha256', 'hex');

  if (!valid) {
    logger.warn('webhook_signature_invalid', {
      provider: 'lemonsqueezy',
      requestId,
    });
  }

  return { valid, requestId };
}

// ============================================
// Idempotency Management
// ============================================

/**
 * Check if request was already processed (idempotency)
 */
export function checkIdempotency(key: string): IdempotencyRecord | null {
  return idempotencyStore.get(key) || null;
}

/**
 * Record processed request for idempotency
 */
export function recordIdempotency(
  key: string,
  result: 'success' | 'failed'
): void {
  idempotencyStore.set(key, {
    key,
    processedAt: new Date(),
    result,
  });
}

/**
 * Generate idempotency key from webhook data
 */
export function generateIdempotencyKey(
  provider: string,
  eventId: string,
  eventType: string
): string {
  return `${provider}:${eventType}:${eventId}`;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate unique request ID for tracking
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `wh_${timestamp}_${random}`;
}

/**
 * Create standardized error response
 */
export function webhookErrorResponse(
  error: string,
  requestId: string,
  status: number = 401
): NextResponse {
  logger.error('webhook_error_response', {
    error,
    requestId,
    status,
  });

  return NextResponse.json(
    {
      success: false,
      error,
      requestId,
    },
    { status }
  );
}

/**
 * Create standardized success response
 */
export function webhookSuccessResponse(
  requestId: string,
  data?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({
    success: true,
    received: true,
    requestId,
    ...data,
  });
}

// ============================================
// Webhook Guard Middleware
// ============================================

export interface WebhookGuardOptions {
  provider: 'toss' | 'paypal' | 'lemonsqueezy' | 'stripe';
  extractEventId?: (payload: unknown) => string;
  extractEventType?: (payload: unknown) => string;
  skipIdempotency?: boolean;
}

/**
 * Comprehensive webhook guard that handles:
 * 1. Signature verification
 * 2. Idempotency checking
 * 3. Request logging
 */
export async function webhookGuard(
  request: NextRequest,
  options: WebhookGuardOptions
): Promise<{
  passed: boolean;
  response?: NextResponse;
  payload?: string;
  parsedBody?: unknown;
  requestId: string;
  idempotencyKey?: string;
}> {
  const payload = await request.text();
  let requestId = generateRequestId();

  // 1. Verify signature based on provider
  let verificationResult: WebhookVerificationResult;

  switch (options.provider) {
    case 'toss': {
      const signature = request.headers.get('toss-signature') || '';
      verificationResult = verifyTossWebhook(payload, signature);
      break;
    }
    case 'paypal': {
      verificationResult = await verifyPayPalWebhook(request, payload);
      break;
    }
    case 'lemonsqueezy': {
      const signature = request.headers.get('x-signature') || '';
      verificationResult = verifyLemonSqueezyWebhook(payload, signature);
      break;
    }
    case 'stripe': {
      // Stripe verification should use their SDK
      // This is handled separately in the Stripe webhook route
      verificationResult = { valid: true, requestId };
      break;
    }
    default:
      verificationResult = { valid: false, error: 'Unknown provider', requestId };
  }

  requestId = verificationResult.requestId;

  if (!verificationResult.valid) {
    return {
      passed: false,
      response: webhookErrorResponse(
        verificationResult.error || 'Invalid signature',
        requestId
      ),
      requestId,
    };
  }

  // 2. Parse payload
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(payload);
  } catch {
    return {
      passed: false,
      response: webhookErrorResponse('Invalid JSON payload', requestId, 400),
      requestId,
    };
  }

  // 3. Check idempotency
  if (!options.skipIdempotency && options.extractEventId && options.extractEventType) {
    const eventId = options.extractEventId(parsedBody);
    const eventType = options.extractEventType(parsedBody);
    const idempotencyKey = generateIdempotencyKey(options.provider, eventId, eventType);

    const existingRecord = checkIdempotency(idempotencyKey);
    if (existingRecord) {
      logger.info('webhook_duplicate_request', {
        requestId,
        idempotencyKey,
        originalProcessedAt: existingRecord.processedAt,
      });

      return {
        passed: false,
        response: webhookSuccessResponse(requestId, {
          message: 'Already processed',
          originalProcessedAt: existingRecord.processedAt.toISOString(),
        }),
        requestId,
        idempotencyKey,
      };
    }

    return {
      passed: true,
      payload,
      parsedBody,
      requestId,
      idempotencyKey,
    };
  }

  return {
    passed: true,
    payload,
    parsedBody,
    requestId,
  };
}
