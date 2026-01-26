/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 59: SECURITY MODULE INDEX
 * ═══════════════════════════════════════════════════════════════════════════════
 * Consolidated security exports for easy import
 */

// Rate Limiting
export {
  checkRateLimit,
  getClientIdentifier,
  RateLimiters,
  rateLimitHeaders,
  type RateLimitConfig,
  type RateLimitResult,
} from './rate-limit';

// API Guard
export {
  apiGuard,
  authenticateRequest,
  validateInput,
  sanitizeString,
  sanitizeObject,
  errorResponse,
  rateLimitResponse,
  unauthorizedResponse,
  FLIGHT_BOOKING_RULES,
  HOTEL_BOOKING_RULES,
  PASSENGER_RULES,
  type AuthenticatedUser,
  type ValidationRule,
  type GuardOptions,
} from './api-guard';

// Encryption
export {
  encrypt,
  decrypt,
  encryptPII,
  decryptPII,
  encryptPIIFields,
  decryptPIIFields,
  maskEmail,
  maskPhone,
  maskPassport,
  maskCreditCard,
  maskName,
  hashPII,
  hashEmail,
  hashPhone,
  isEncryptionConfigured,
  isValidEncryptedData,
  type EncryptedData,
  type PIIData,
  type EncryptedPII,
} from './encryption';

// Webhook Guard
export {
  webhookGuard,
  verifyHmacSignature,
  verifyTimestamp,
  verifyTossWebhook,
  verifyPayPalWebhook,
  verifyLemonSqueezyWebhook,
  checkIdempotency,
  recordIdempotency,
  generateIdempotencyKey,
  generateRequestId,
  webhookErrorResponse,
  webhookSuccessResponse,
  WEBHOOK_CONFIGS,
  type WebhookVerificationResult,
  type WebhookConfig,
  type IdempotencyRecord,
  type WebhookGuardOptions,
} from './webhook-guard';

// Validation (Phase 59)
export {
  isValidEmail,
  isValidUrl,
  isValidUUID,
  isValidEthAddress,
  isValidTxHash,
  isValidKoreanPhone,
  sanitizeNumber,
  escapeHtml,
  validateRequest,
  hasSQLInjection,
  safeJSONParse,
  safeJSONStringify,
  type ValidationSchema,
  type ValidationResult,
} from './validation';
