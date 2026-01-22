/**
 * K-UNIVERSAL Payment Idempotency System
 * Prevents duplicate payments and ensures exactly-once processing
 *
 * Features:
 * - Idempotency key validation and tracking
 * - Supabase-based persistent storage
 * - Automatic cleanup of expired keys
 * - Request locking to prevent race conditions
 *
 * @module lib/payment/idempotency
 */

import { supabaseAdmin } from '@/lib/supabase/server';
import { logger } from '@/lib/logging/logger';
import crypto from 'crypto';

// ============================================
// Types
// ============================================

export interface IdempotencyRecord {
  id: string;
  idempotency_key: string;
  user_id: string;
  request_path: string;
  request_method: string;
  request_hash: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  response_status?: number;
  response_body?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface IdempotencyCheckResult {
  exists: boolean;
  record?: IdempotencyRecord;
  canProcess: boolean;
  cachedResponse?: {
    status: number;
    body: unknown;
  };
}

export interface IdempotencyOptions {
  expiresInHours?: number;
  lockTimeoutMs?: number;
}

// ============================================
// Constants
// ============================================

const DEFAULT_EXPIRY_HOURS = 24;
const DEFAULT_LOCK_TIMEOUT_MS = 30000; // 30 seconds
const MAX_KEY_LENGTH = 255;

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a hash of the request body for validation
 */
export function hashRequestBody(body: unknown): string {
  const content = typeof body === 'string' ? body : JSON.stringify(body);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Validate idempotency key format
 */
export function validateIdempotencyKey(key: string): {
  valid: boolean;
  error?: string;
} {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Idempotency key is required' };
  }

  if (key.length > MAX_KEY_LENGTH) {
    return { valid: false, error: `Idempotency key must be <= ${MAX_KEY_LENGTH} characters` };
  }

  // Allow alphanumeric, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
    return { valid: false, error: 'Idempotency key contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Generate a unique idempotency key
 */
export function generateIdempotencyKey(prefix: string = 'idem'): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
}

// ============================================
// Core Functions
// ============================================

/**
 * Check if a request with this idempotency key has been processed
 */
export async function checkIdempotency(
  idempotencyKey: string,
  userId: string,
  requestPath: string,
  requestBody: unknown
): Promise<IdempotencyCheckResult> {
  try {
    const requestHash = hashRequestBody(requestBody);

    const { data: existing, error } = await supabaseAdmin
      .from('payment_idempotency')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is expected for new keys
      logger.error('idempotency_check_error', {
        idempotencyKey,
        userId,
        error: error.message,
      });
      throw error;
    }

    if (!existing) {
      return { exists: false, canProcess: true };
    }

    // Check if request body matches (prevents misuse of idempotency key)
    if (existing.request_hash !== requestHash) {
      logger.warn('idempotency_key_reuse_different_body', {
        idempotencyKey,
        userId,
        originalHash: existing.request_hash,
        newHash: requestHash,
      });
      return {
        exists: true,
        record: existing,
        canProcess: false,
      };
    }

    // Check if expired
    if (new Date(existing.expires_at) < new Date()) {
      // Expired - can reprocess
      logger.info('idempotency_key_expired', {
        idempotencyKey,
        userId,
        expiredAt: existing.expires_at,
      });
      return { exists: true, record: existing, canProcess: true };
    }

    // Check status
    switch (existing.status) {
      case 'completed':
        // Return cached response
        return {
          exists: true,
          record: existing,
          canProcess: false,
          cachedResponse: existing.response_body
            ? {
                status: existing.response_status || 200,
                body: JSON.parse(existing.response_body),
              }
            : undefined,
        };

      case 'processing':
        // Currently being processed - check lock timeout
        const processingTime = Date.now() - new Date(existing.updated_at).getTime();
        if (processingTime > DEFAULT_LOCK_TIMEOUT_MS) {
          // Lock expired, can retry
          logger.warn('idempotency_lock_expired', {
            idempotencyKey,
            userId,
            processingTimeMs: processingTime,
          });
          return { exists: true, record: existing, canProcess: true };
        }
        // Still processing
        return { exists: true, record: existing, canProcess: false };

      case 'failed':
        // Previous attempt failed, can retry
        return { exists: true, record: existing, canProcess: true };

      case 'pending':
        // Should process
        return { exists: true, record: existing, canProcess: true };

      default:
        return { exists: true, record: existing, canProcess: false };
    }
  } catch (error) {
    logger.error('idempotency_check_failed', {
      idempotencyKey,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Create or update idempotency record with 'processing' status
 */
export async function lockIdempotencyKey(
  idempotencyKey: string,
  userId: string,
  requestPath: string,
  requestMethod: string,
  requestBody: unknown,
  options: IdempotencyOptions = {}
): Promise<IdempotencyRecord> {
  const expiresInHours = options.expiresInHours || DEFAULT_EXPIRY_HOURS;
  const requestHash = hashRequestBody(requestBody);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);

  const record: Partial<IdempotencyRecord> = {
    idempotency_key: idempotencyKey,
    user_id: userId,
    request_path: requestPath,
    request_method: requestMethod,
    request_hash: requestHash,
    status: 'processing',
    updated_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('payment_idempotency')
    .upsert(
      {
        ...record,
        created_at: now.toISOString(),
      },
      {
        onConflict: 'idempotency_key,user_id',
      }
    )
    .select()
    .single();

  if (error) {
    logger.error('idempotency_lock_failed', {
      idempotencyKey,
      userId,
      error: error.message,
    });
    throw error;
  }

  logger.info('idempotency_key_locked', {
    idempotencyKey,
    userId,
    requestPath,
  });

  return data as IdempotencyRecord;
}

/**
 * Mark idempotency record as completed with response
 */
export async function completeIdempotencyKey(
  idempotencyKey: string,
  userId: string,
  responseStatus: number,
  responseBody: unknown
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('payment_idempotency')
    .update({
      status: 'completed',
      response_status: responseStatus,
      response_body: JSON.stringify(responseBody),
      updated_at: new Date().toISOString(),
    })
    .eq('idempotency_key', idempotencyKey)
    .eq('user_id', userId);

  if (error) {
    logger.error('idempotency_complete_failed', {
      idempotencyKey,
      userId,
      error: error.message,
    });
    throw error;
  }

  logger.info('idempotency_key_completed', {
    idempotencyKey,
    userId,
    responseStatus,
  });
}

/**
 * Mark idempotency record as failed
 */
export async function failIdempotencyKey(
  idempotencyKey: string,
  userId: string,
  errorMessage: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('payment_idempotency')
    .update({
      status: 'failed',
      response_body: JSON.stringify({ error: errorMessage }),
      updated_at: new Date().toISOString(),
    })
    .eq('idempotency_key', idempotencyKey)
    .eq('user_id', userId);

  if (error) {
    logger.error('idempotency_fail_update_failed', {
      idempotencyKey,
      userId,
      error: error.message,
    });
  }

  logger.info('idempotency_key_failed', {
    idempotencyKey,
    userId,
    errorMessage,
  });
}

// ============================================
// Middleware Helper
// ============================================

export interface IdempotentRequestContext {
  idempotencyKey: string;
  userId: string;
  isRetry: boolean;
  complete: (status: number, body: unknown) => Promise<void>;
  fail: (error: string) => Promise<void>;
}

/**
 * Wrapper for idempotent payment operations
 */
export async function withIdempotency<T>(
  idempotencyKey: string,
  userId: string,
  requestPath: string,
  requestMethod: string,
  requestBody: unknown,
  handler: (ctx: IdempotentRequestContext) => Promise<T>
): Promise<{
  success: boolean;
  data?: T;
  cached?: boolean;
  error?: string;
}> {
  // Validate key
  const validation = validateIdempotencyKey(idempotencyKey);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Check existing
  const check = await checkIdempotency(idempotencyKey, userId, requestPath, requestBody);

  // Return cached response if available
  if (check.cachedResponse) {
    logger.info('idempotency_returning_cached', {
      idempotencyKey,
      userId,
    });
    return {
      success: true,
      data: check.cachedResponse.body as T,
      cached: true,
    };
  }

  // Cannot process (e.g., different body with same key)
  if (!check.canProcess) {
    return {
      success: false,
      error: 'Request is being processed or idempotency key was used with different parameters',
    };
  }

  // Lock and process
  try {
    await lockIdempotencyKey(
      idempotencyKey,
      userId,
      requestPath,
      requestMethod,
      requestBody
    );

    const ctx: IdempotentRequestContext = {
      idempotencyKey,
      userId,
      isRetry: check.exists,
      complete: async (status, body) => {
        await completeIdempotencyKey(idempotencyKey, userId, status, body);
      },
      fail: async (error) => {
        await failIdempotencyKey(idempotencyKey, userId, error);
      },
    };

    const result = await handler(ctx);
    return { success: true, data: result };
  } catch (error) {
    await failIdempotencyKey(
      idempotencyKey,
      userId,
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}

// ============================================
// Cleanup
// ============================================

/**
 * Clean up expired idempotency records
 * Should be run periodically (e.g., daily cron job)
 */
export async function cleanupExpiredIdempotencyRecords(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('payment_idempotency')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) {
    logger.error('idempotency_cleanup_failed', { error: error.message });
    return 0;
  }

  const count = data?.length || 0;
  logger.info('idempotency_cleanup_completed', { deletedCount: count });
  return count;
}
