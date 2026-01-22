/**
 * K-UNIVERSAL Server-Side Validation Middleware
 * Production-grade request validation for all API routes
 *
 * Features:
 * - Strong type validation
 * - SQL injection prevention
 * - XSS attack prevention
 * - Request size limits
 * - Schema-based validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { sanitizeHtml, sanitizeSql, stripTags, truncate } from './sanitize';
import { checkRateLimit, rateLimitResponse } from './api-guard';

// ============================================
// Types
// ============================================

export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'url' | 'array' | 'object';

export interface FieldSchema {
  type: FieldType;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: (string | number)[];
  items?: FieldSchema;           // For arrays
  properties?: ValidationSchema; // For objects
  sanitize?: boolean;            // Whether to auto-sanitize (default: true)
  custom?: (value: unknown) => { valid: boolean; error?: string };
}

export interface ValidationSchema {
  [field: string]: FieldSchema;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedData: Record<string, unknown>;
}

export interface MiddlewareConfig {
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  maxBodySize?: number;        // Max request body size in bytes
  schema?: ValidationSchema;   // Validation schema
  requireAuth?: boolean;       // Require authentication
  allowedMethods?: string[];   // Allowed HTTP methods
}

// ============================================
// Constants
// ============================================

const DEFAULT_MAX_BODY_SIZE = 1024 * 1024; // 1MB
const DEFAULT_MAX_STRING_LENGTH = 10000;
const DEFAULT_MAX_ARRAY_LENGTH = 1000;

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/gi,
  /(--|;|\/\*|\*\/)/g,
  /(\bOR\b|\bAND\b)\s*\d+\s*=\s*\d+/gi,
  /'\s*(OR|AND)\s*'.*'/gi,
];

// XSS patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<\s*iframe/gi,
  /<\s*object/gi,
  /<\s*embed/gi,
];

// ============================================
// Validation Functions
// ============================================

/**
 * Check for SQL injection attempts
 */
export function detectSqlInjection(value: string): boolean {
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Check for XSS attempts
 */
export function detectXss(value: string): boolean {
  return XSS_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (international)
 */
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-+()]{8,20}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize a string value
 */
function sanitizeString(value: string, maxLength: number = DEFAULT_MAX_STRING_LENGTH): string {
  // Check for injection attempts
  if (detectSqlInjection(value) || detectXss(value)) {
    // Strip dangerous content
    let sanitized = sanitizeHtml(value);
    sanitized = sanitizeSql(sanitized);
    sanitized = stripTags(sanitized);
    return truncate(sanitized, maxLength);
  }

  return truncate(sanitizeHtml(value), maxLength);
}

/**
 * Validate a single field
 */
function validateField(
  value: unknown,
  schema: FieldSchema,
  fieldName: string
): { valid: boolean; error?: string; sanitized?: unknown } {
  // Required check
  if (schema.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${fieldName}은(는) 필수 항목입니다` };
  }

  // Skip if not required and empty
  if (!schema.required && (value === undefined || value === null || value === '')) {
    return { valid: true, sanitized: undefined };
  }

  // Type validation
  switch (schema.type) {
    case 'string': {
      if (typeof value !== 'string') {
        return { valid: false, error: `${fieldName}은(는) 문자열이어야 합니다` };
      }

      // Length checks
      if (schema.minLength && value.length < schema.minLength) {
        return { valid: false, error: `${fieldName}은(는) 최소 ${schema.minLength}자 이상이어야 합니다` };
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        return { valid: false, error: `${fieldName}은(는) 최대 ${schema.maxLength}자까지 입력 가능합니다` };
      }

      // Pattern check
      if (schema.pattern && !schema.pattern.test(value)) {
        return { valid: false, error: `${fieldName}의 형식이 올바르지 않습니다` };
      }

      // Enum check
      if (schema.enum && !schema.enum.includes(value)) {
        return { valid: false, error: `${fieldName}은(는) 허용된 값이 아닙니다` };
      }

      // Sanitize
      const sanitized = schema.sanitize !== false ? sanitizeString(value, schema.maxLength) : value;
      return { valid: true, sanitized };
    }

    case 'number': {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (typeof num !== 'number' || isNaN(num)) {
        return { valid: false, error: `${fieldName}은(는) 숫자여야 합니다` };
      }

      if (schema.min !== undefined && num < schema.min) {
        return { valid: false, error: `${fieldName}은(는) ${schema.min} 이상이어야 합니다` };
      }
      if (schema.max !== undefined && num > schema.max) {
        return { valid: false, error: `${fieldName}은(는) ${schema.max} 이하여야 합니다` };
      }

      return { valid: true, sanitized: num };
    }

    case 'boolean': {
      if (typeof value !== 'boolean') {
        return { valid: false, error: `${fieldName}은(는) 불리언이어야 합니다` };
      }
      return { valid: true, sanitized: value };
    }

    case 'date': {
      if (typeof value !== 'string' || !isValidDate(value)) {
        return { valid: false, error: `${fieldName}은(는) 유효한 날짜(YYYY-MM-DD)여야 합니다` };
      }
      return { valid: true, sanitized: value };
    }

    case 'email': {
      if (typeof value !== 'string' || !isValidEmail(value)) {
        return { valid: false, error: `${fieldName}은(는) 유효한 이메일 주소여야 합니다` };
      }
      return { valid: true, sanitized: value.toLowerCase().trim() };
    }

    case 'phone': {
      if (typeof value !== 'string' || !isValidPhone(value)) {
        return { valid: false, error: `${fieldName}은(는) 유효한 전화번호여야 합니다` };
      }
      return { valid: true, sanitized: value.replace(/\D/g, '') };
    }

    case 'url': {
      if (typeof value !== 'string' || !isValidUrl(value)) {
        return { valid: false, error: `${fieldName}은(는) 유효한 URL이어야 합니다` };
      }
      return { valid: true, sanitized: value };
    }

    case 'array': {
      if (!Array.isArray(value)) {
        return { valid: false, error: `${fieldName}은(는) 배열이어야 합니다` };
      }

      if (value.length > DEFAULT_MAX_ARRAY_LENGTH) {
        return { valid: false, error: `${fieldName} 배열이 너무 깁니다` };
      }

      if (schema.items) {
        const sanitizedArray: unknown[] = [];
        for (let i = 0; i < value.length; i++) {
          const result = validateField(value[i], schema.items, `${fieldName}[${i}]`);
          if (!result.valid) {
            return result;
          }
          sanitizedArray.push(result.sanitized);
        }
        return { valid: true, sanitized: sanitizedArray };
      }

      return { valid: true, sanitized: value };
    }

    case 'object': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { valid: false, error: `${fieldName}은(는) 객체여야 합니다` };
      }

      if (schema.properties) {
        const sanitizedObject: Record<string, unknown> = {};
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const propValue = (value as Record<string, unknown>)[key];
          const result = validateField(propValue, propSchema, `${fieldName}.${key}`);
          if (!result.valid) {
            return result;
          }
          if (result.sanitized !== undefined) {
            sanitizedObject[key] = result.sanitized;
          }
        }
        return { valid: true, sanitized: sanitizedObject };
      }

      return { valid: true, sanitized: value };
    }

    default:
      return { valid: false, error: `알 수 없는 타입: ${schema.type}` };
  }
}

/**
 * Validate entire request body against schema
 */
export function validateRequestBody(
  body: Record<string, unknown>,
  schema: ValidationSchema
): ValidationResult {
  const errors: string[] = [];
  const sanitizedData: Record<string, unknown> = {};

  for (const [field, fieldSchema] of Object.entries(schema)) {
    const value = body[field];
    const result = validateField(value, fieldSchema, field);

    if (!result.valid && result.error) {
      errors.push(result.error);
    } else if (result.sanitized !== undefined) {
      sanitizedData[field] = result.sanitized;
    }
  }

  // Custom validation
  for (const [field, fieldSchema] of Object.entries(schema)) {
    if (fieldSchema.custom && sanitizedData[field] !== undefined) {
      const customResult = fieldSchema.custom(sanitizedData[field]);
      if (!customResult.valid && customResult.error) {
        errors.push(customResult.error);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedData,
  };
}

// ============================================
// Middleware
// ============================================

/**
 * Create validation middleware for API routes
 */
export function createValidationMiddleware(config: MiddlewareConfig) {
  return async function middleware(request: NextRequest): Promise<{
    passed: boolean;
    response?: NextResponse;
    body?: Record<string, unknown>;
  }> {
    // Check allowed methods
    if (config.allowedMethods && !config.allowedMethods.includes(request.method)) {
      return {
        passed: false,
        response: NextResponse.json(
          { success: false, error: 'Method not allowed' },
          { status: 405 }
        ),
      };
    }

    // Rate limiting
    if (config.rateLimit) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                 request.headers.get('x-real-ip') ||
                 'unknown';
      const result = checkRateLimit(ip, config.rateLimit);
      if (!result.allowed) {
        return {
          passed: false,
          response: rateLimitResponse(result.resetIn),
        };
      }
    }

    // Parse and validate body for POST/PUT/PATCH
    let body: Record<string, unknown> = {};
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const text = await request.text();

        // Check body size
        if (text.length > (config.maxBodySize || DEFAULT_MAX_BODY_SIZE)) {
          return {
            passed: false,
            response: NextResponse.json(
              { success: false, error: '요청 크기가 너무 큽니다' },
              { status: 413 }
            ),
          };
        }

        body = JSON.parse(text);
      } catch {
        return {
          passed: false,
          response: NextResponse.json(
            { success: false, error: '올바른 JSON 형식이 아닙니다' },
            { status: 400 }
          ),
        };
      }

      // Validate against schema
      if (config.schema) {
        const validation = validateRequestBody(body, config.schema);
        if (!validation.valid) {
          return {
            passed: false,
            response: NextResponse.json(
              { success: false, errors: validation.errors },
              { status: 400 }
            ),
          };
        }
        body = validation.sanitizedData;
      }
    }

    return { passed: true, body };
  };
}

// ============================================
// Common Schemas
// ============================================

export const FLIGHT_SEARCH_SCHEMA: ValidationSchema = {
  origin: { type: 'string', required: true, minLength: 3, maxLength: 3, pattern: /^[A-Z]{3}$/ },
  destination: { type: 'string', required: true, minLength: 3, maxLength: 3, pattern: /^[A-Z]{3}$/ },
  departureDate: { type: 'date', required: true },
  returnDate: { type: 'date', required: false },
  adults: { type: 'number', required: true, min: 1, max: 9 },
  children: { type: 'number', required: false, min: 0, max: 9 },
  infants: { type: 'number', required: false, min: 0, max: 9 },
  cabinClass: { type: 'string', required: false, enum: ['economy', 'premium_economy', 'business', 'first'] },
};

export const HOTEL_SEARCH_SCHEMA: ValidationSchema = {
  city: { type: 'string', required: true, minLength: 2, maxLength: 10 },
  checkIn: { type: 'date', required: true },
  checkOut: { type: 'date', required: true },
  guests: { type: 'number', required: false, min: 1, max: 10 },
  rooms: { type: 'number', required: false, min: 1, max: 5 },
};

export const BOOKING_SCHEMA: ValidationSchema = {
  productId: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  productType: { type: 'string', required: true, enum: ['flight', 'hotel'] },
  paymentMethod: { type: 'string', required: true, enum: ['card', 'paypal', 'wallet'] },
  passenger: {
    type: 'object',
    required: true,
    properties: {
      firstName: { type: 'string', required: true, minLength: 1, maxLength: 50 },
      lastName: { type: 'string', required: true, minLength: 1, maxLength: 50 },
      email: { type: 'email', required: true },
      phone: { type: 'phone', required: true },
      dateOfBirth: { type: 'date', required: false },
    },
  },
};

export const CONTACT_SCHEMA: ValidationSchema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
  email: { type: 'email', required: true },
  phone: { type: 'phone', required: false },
  subject: { type: 'string', required: true, minLength: 5, maxLength: 200 },
  message: { type: 'string', required: true, minLength: 10, maxLength: 5000 },
};
