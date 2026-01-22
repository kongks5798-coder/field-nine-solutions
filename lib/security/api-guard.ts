/**
 * K-UNIVERSAL API Security Guard
 * Production-grade security for booking APIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'date' | 'phone';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// ============================================
// Rate Limiting (In-Memory for Serverless)
// ============================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetIn: record.resetTime - now,
  };
}

// ============================================
// Input Validation
// ============================================

export function validateInput(
  data: Record<string, unknown>,
  rules: ValidationRule[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = data[rule.field];

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${rule.field} is required`);
      continue;
    }

    // Skip validation if not required and empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type checks
    if (rule.type) {
      switch (rule.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${rule.field} must be a string`);
          }
          break;
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`${rule.field} must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${rule.field} must be a boolean`);
          }
          break;
        case 'email':
          if (typeof value !== 'string' || !isValidEmail(value)) {
            errors.push(`${rule.field} must be a valid email`);
          }
          break;
        case 'date':
          if (typeof value !== 'string' || !isValidDate(value)) {
            errors.push(`${rule.field} must be a valid date (YYYY-MM-DD)`);
          }
          break;
        case 'phone':
          if (typeof value !== 'string' || !isValidPhone(value)) {
            errors.push(`${rule.field} must be a valid phone number`);
          }
          break;
      }
    }

    // Length checks for strings
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${rule.field} must be at most ${rule.maxLength} characters`);
      }
    }

    // Range checks for numbers
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${rule.field} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${rule.field} must be at most ${rule.max}`);
      }
    }

    // Pattern check
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push(`${rule.field} has invalid format`);
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      errors.push(`${rule.field} failed custom validation`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================
// Helper Functions
// ============================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

function isValidPhone(phone: string): boolean {
  // Allow various phone formats
  const phoneRegex = /^[\d\s\-+()]{8,20}$/;
  return phoneRegex.test(phone);
}

// ============================================
// Authentication
// ============================================

export async function authenticateRequest(
  request: NextRequest
): Promise<{ authenticated: boolean; user: AuthenticatedUser | null; error?: string }> {
  try {
    // Get auth token from cookie or header
    const authHeader = request.headers.get('authorization');
    const authCookie = request.cookies.get('sb-access-token')?.value;

    const token = authHeader?.replace('Bearer ', '') || authCookie;

    if (!token) {
      return { authenticated: false, user: null, error: 'No authentication token provided' };
    }

    // Verify with Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // In development without Supabase, allow demo mode
      if (process.env.NODE_ENV === 'development') {
        return {
          authenticated: true,
          user: { id: 'demo-user', email: 'demo@example.com', role: 'user' },
        };
      }
      return { authenticated: false, user: null, error: 'Auth service not configured' };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { authenticated: false, user: null, error: 'Invalid or expired token' };
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email || '',
        role: (user.user_metadata?.role as 'user' | 'admin') || 'user',
      },
    };
  } catch (error) {
    console.error('Auth error:', error);
    return { authenticated: false, user: null, error: 'Authentication failed' };
  }
}

// ============================================
// Sanitization
// ============================================

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, ''); // Remove potentially dangerous chars
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

// ============================================
// API Response Helpers
// ============================================

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

export function rateLimitResponse(resetIn: number) {
  return NextResponse.json(
    { success: false, error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': Math.ceil(resetIn / 1000).toString(),
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}

export function unauthorizedResponse(message: string = 'Authentication required') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

// ============================================
// Combined Guard Function
// ============================================

export interface GuardOptions {
  requireAuth?: boolean;
  rateLimit?: RateLimitConfig;
  validationRules?: ValidationRule[];
}

export async function apiGuard(
  request: NextRequest,
  options: GuardOptions = {}
): Promise<{
  passed: boolean;
  response?: NextResponse;
  user?: AuthenticatedUser;
  body?: Record<string, unknown>;
}> {
  const { requireAuth = true, rateLimit, validationRules } = options;

  // 1. Rate limiting
  if (rateLimit) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const rateLimitResult = checkRateLimit(ip, rateLimit);

    if (!rateLimitResult.allowed) {
      return { passed: false, response: rateLimitResponse(rateLimitResult.resetIn) };
    }
  }

  // 2. Authentication
  let user: AuthenticatedUser | undefined;
  if (requireAuth) {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return { passed: false, response: unauthorizedResponse(authResult.error) };
    }
    user = authResult.user || undefined;
  }

  // 3. Parse and validate body
  let body: Record<string, unknown> = {};
  if (request.method !== 'GET' && request.method !== 'DELETE') {
    try {
      body = await request.json();
      body = sanitizeObject(body);
    } catch {
      return { passed: false, response: errorResponse('Invalid JSON body') };
    }

    if (validationRules) {
      const validation = validateInput(body, validationRules);
      if (!validation.valid) {
        return { passed: false, response: errorResponse(validation.errors.join(', ')) };
      }
    }
  }

  return { passed: true, user, body };
}

// ============================================
// Booking-Specific Validation Rules
// ============================================

export const FLIGHT_BOOKING_RULES: ValidationRule[] = [
  { field: 'offerId', required: true, type: 'string', minLength: 1 },
  { field: 'passengers', required: true },
  { field: 'paymentMethod', required: true, type: 'string' },
];

export const HOTEL_BOOKING_RULES: ValidationRule[] = [
  { field: 'hotelId', required: true, type: 'string', minLength: 1 },
  { field: 'hotelName', required: true, type: 'string', minLength: 1 },
  { field: 'checkIn', required: true, type: 'date' },
  { field: 'checkOut', required: true, type: 'date' },
  { field: 'paymentMethod', required: true, type: 'string' },
];

export const PASSENGER_RULES: ValidationRule[] = [
  { field: 'givenName', required: true, type: 'string', minLength: 1, maxLength: 100 },
  { field: 'familyName', required: true, type: 'string', minLength: 1, maxLength: 100 },
  { field: 'email', required: true, type: 'email' },
  { field: 'phone', required: true, type: 'phone' },
  { field: 'dateOfBirth', required: false, type: 'date' },
];
