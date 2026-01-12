/**
 * K-UNIVERSAL Environment Variable Validator
 * Ensures all required env vars are present
 */

interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  STRIPE_SECRET_KEY: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
];

const optionalEnvVars = [
  'OPENAI_API_KEY',
  'GOOGLE_VISION_API_KEY',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'CARD_ENCRYPTION_KEY',
];

/**
 * Validate environment variables on startup
 */
export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check optional but recommended vars
  for (const varName of optionalEnvVars) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  // Report missing required vars
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((v) => console.error(`   - ${v}`));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot start: Missing required environment variables');
    }
  }

  // Report warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Missing optional environment variables:');
    warnings.forEach((v) => console.warn(`   - ${v}`));
  }

  // Success
  if (missing.length === 0) {
    console.log('✅ Environment variables validated successfully');
  }
}

/**
 * Sanitize sensitive env vars for logging
 */
export function sanitizeEnv(env: Record<string, any>): Record<string, string> {
  const sensitiveKeys = ['KEY', 'SECRET', 'TOKEN', 'PASSWORD'];
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    const isSensitive = sensitiveKeys.some((k) => key.includes(k));
    sanitized[key] = isSensitive ? '***REDACTED***' : String(value);
  }

  return sanitized;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get app URL based on environment
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (isProduction()) {
    return 'https://k-universal.com';
  }

  return 'http://localhost:3000';
}
