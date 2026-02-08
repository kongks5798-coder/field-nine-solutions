/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 59: INPUT VALIDATION & SANITIZATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * Production-ready input validation and XSS protection
 */

// ═══════════════════════════════════════════════════════════════════════════════
// BASIC VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 320;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate Ethereum address
 */
export function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate transaction hash
 */
export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate Korean phone number
 */
export function isValidKoreanPhone(phone: string): boolean {
  const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sanitize string input - remove potential XSS vectors
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
}

/**
 * Sanitize for HTML output (escape special characters)
 */
export function escapeHtml(input: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => htmlEscapes[char] || char);
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: unknown, min?: number, max?: number): number {
  const num = typeof input === 'number' ? input : parseFloat(String(input));

  if (isNaN(num)) return 0;
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;

  return num;
}

/**
 * Sanitize object - recursively sanitize all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (value && typeof value === 'object') {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      (sanitized as Record<string, unknown>)[key] = value;
    }
  }

  return sanitized;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'eth_address';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  sanitized: Record<string, unknown>;
}

/**
 * Validate request body against schema
 */
export function validateRequest(
  body: Record<string, unknown>,
  schema: ValidationSchema
): ValidationResult {
  const errors: Record<string, string> = {};
  const sanitized: Record<string, unknown> = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }

    // Skip validation if not required and empty
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    if (rules.type) {
      switch (rules.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors[field] = `${field} must be a string`;
            continue;
          }
          sanitized[field] = sanitizeString(value, rules.maxLength);
          break;

        case 'number':
          const num = sanitizeNumber(value, rules.min, rules.max);
          if (isNaN(num)) {
            errors[field] = `${field} must be a number`;
            continue;
          }
          sanitized[field] = num;
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            errors[field] = `${field} must be a boolean`;
            continue;
          }
          sanitized[field] = value;
          break;

        case 'email':
          if (!isValidEmail(String(value))) {
            errors[field] = `${field} must be a valid email`;
            continue;
          }
          sanitized[field] = sanitizeString(String(value).toLowerCase());
          break;

        case 'url':
          if (!isValidUrl(String(value))) {
            errors[field] = `${field} must be a valid URL`;
            continue;
          }
          sanitized[field] = String(value);
          break;

        case 'uuid':
          if (!isValidUUID(String(value))) {
            errors[field] = `${field} must be a valid UUID`;
            continue;
          }
          sanitized[field] = String(value);
          break;

        case 'eth_address':
          if (!isValidEthAddress(String(value))) {
            errors[field] = `${field} must be a valid Ethereum address`;
            continue;
          }
          sanitized[field] = String(value).toLowerCase();
          break;
      }
    }

    // Length validation for strings
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors[field] = `${field} must be at least ${rules.minLength} characters`;
        continue;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors[field] = `${field} must be at most ${rules.maxLength} characters`;
        continue;
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors[field] = `${field} has invalid format`;
      continue;
    }

    // Custom validation
    if (rules.custom && !rules.custom(value)) {
      errors[field] = `${field} failed validation`;
      continue;
    }

    // If no sanitized value set yet, use original
    if (sanitized[field] === undefined) {
      sanitized[field] = value;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SQL INJECTION PREVENTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check for potential SQL injection patterns
 */
export function hasSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b|\bAND\b).*[=<>]/i,
    /'.*'.*=/,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Escape SQL special characters (for logging only - use parameterized queries)
 */
export function escapeSQLForLogging(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

// ═══════════════════════════════════════════════════════════════════════════════
// JSON SAFETY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Safely parse JSON with error handling
 */
export function safeJSONParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely stringify JSON with circular reference handling
 */
export function safeJSONStringify(obj: unknown, space?: number): string {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (_, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    },
    space
  );
}
