/**
 * Input Sanitization Utilities
 * Prevent XSS, SQL Injection, and other injection attacks
 */

/**
 * Remove HTML tags and escape special characters
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Remove potentially dangerous characters for SQL queries
 * Note: Always use parameterized queries - this is a defense-in-depth measure
 */
export function sanitizeSql(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/xp_/gi, '')
    .replace(/exec\s/gi, '');
}

/**
 * Sanitize string for safe use in file paths
 */
export function sanitizePath(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/\.\./g, '') // Prevent directory traversal
    .replace(/[<>:"|?*]/g, '') // Remove invalid path characters
    .replace(/\\/g, '/') // Normalize path separators
    .replace(/\/+/g, '/'); // Remove duplicate slashes
}

/**
 * Sanitize string for use in URLs
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') return '';

  try {
    const url = new URL(input);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '';
    }
    return url.href;
  } catch {
    return '';
  }
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';

  const trimmed = input.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    return '';
  }

  return trimmed;
}

/**
 * Sanitize phone number (Korean format)
 */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // Remove all non-numeric characters
  const digits = input.replace(/\D/g, '');

  // Korean phone number: 010-1234-5678 or 02-123-4567
  if (digits.length >= 9 && digits.length <= 11) {
    return digits;
  }

  return '';
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(
  input: string | number,
  options?: { min?: number; max?: number; integer?: boolean }
): number | null {
  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num)) return null;

  let result = num;

  if (options?.integer) {
    result = Math.floor(result);
  }

  if (options?.min !== undefined && result < options.min) {
    return null;
  }

  if (options?.max !== undefined && result > options.max) {
    return null;
  }

  return result;
}

/**
 * Sanitize JSON input
 */
export function sanitizeJson<T = unknown>(input: string): T | null {
  if (!input || typeof input !== 'string') return null;

  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

/**
 * Strip all HTML tags from string
 */
export function stripTags(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input.replace(/<[^>]*>/g, '');
}

/**
 * Truncate string to maximum length
 */
export function truncate(input: string, maxLength: number): string {
  if (!input || typeof input !== 'string') return '';

  if (input.length <= maxLength) return input;

  return input.slice(0, maxLength);
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options?: { maxDepth?: number; maxStringLength?: number }
): T {
  const maxDepth = options?.maxDepth ?? 10;
  const maxStringLength = options?.maxStringLength ?? 10000;

  function sanitizeValue(value: unknown, depth: number): unknown {
    if (depth > maxDepth) return null;

    if (value === null || value === undefined) return value;

    if (typeof value === 'string') {
      return truncate(sanitizeHtml(value), maxStringLength);
    }

    if (typeof value === 'number') {
      return isFinite(value) ? value : null;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.slice(0, 1000).map((v) => sanitizeValue(v, depth + 1));
    }

    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};
      const entries = Object.entries(value as Record<string, unknown>).slice(0, 100);
      for (const [k, v] of entries) {
        const sanitizedKey = truncate(sanitizeHtml(k), 100);
        result[sanitizedKey] = sanitizeValue(v, depth + 1);
      }
      return result;
    }

    return null;
  }

  return sanitizeValue(obj, 0) as T;
}

/**
 * Validate and sanitize request body
 */
export interface SanitizedRequest<T> {
  valid: boolean;
  data: T | null;
  errors: string[];
}

export function sanitizeRequestBody<T extends Record<string, unknown>>(
  body: unknown,
  schema: {
    [K in keyof T]: {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      required?: boolean;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: RegExp;
    };
  }
): SanitizedRequest<T> {
  const errors: string[] = [];
  const result: Record<string, unknown> = {};

  if (!body || typeof body !== 'object') {
    return { valid: false, data: null, errors: ['Invalid request body'] };
  }

  const bodyObj = body as Record<string, unknown>;

  for (const [key, rules] of Object.entries(schema)) {
    const value = bodyObj[key];

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required`);
      continue;
    }

    if (value === undefined || value === null) {
      continue;
    }

    // Type check and sanitize
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${key} must be a string`);
        } else {
          let sanitized = sanitizeHtml(value);
          if (rules.maxLength) {
            sanitized = truncate(sanitized, rules.maxLength);
          }
          if (rules.pattern && !rules.pattern.test(sanitized)) {
            errors.push(`${key} has invalid format`);
          } else {
            result[key] = sanitized;
          }
        }
        break;

      case 'number':
        const num = sanitizeNumber(value as string | number, {
          min: rules.min,
          max: rules.max,
        });
        if (num === null) {
          errors.push(`${key} must be a valid number${rules.min !== undefined ? ` >= ${rules.min}` : ''}${rules.max !== undefined ? ` <= ${rules.max}` : ''}`);
        } else {
          result[key] = num;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${key} must be a boolean`);
        } else {
          result[key] = value;
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${key} must be an array`);
        } else {
          result[key] = value.slice(0, 1000);
        }
        break;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push(`${key} must be an object`);
        } else {
          result[key] = sanitizeObject(value as Record<string, unknown>);
        }
        break;
    }
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? (result as T) : null,
    errors,
  };
}
