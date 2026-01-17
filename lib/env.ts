/**
 * K-Universal Environment Configuration
 * Type-safe environment variable validation
 */

interface EnvConfig {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;

  // Toss Payments
  NEXT_PUBLIC_TOSS_CLIENT_KEY?: string;
  TOSS_SECRET_KEY?: string;
  TOSS_WEBHOOK_SECRET?: string;

  // Push Notifications
  NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;

  // App
  NEXT_PUBLIC_APP_URL?: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Get typed environment variables
 */
export function getEnv(): EnvConfig {
  return {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

    // Toss
    NEXT_PUBLIC_TOSS_CLIENT_KEY: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
    TOSS_SECRET_KEY: process.env.TOSS_SECRET_KEY,
    TOSS_WEBHOOK_SECRET: process.env.TOSS_WEBHOOK_SECRET,

    // Push
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,

    // App
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
  };
}

/**
 * Validate environment configuration
 */
export function validateEnv(): ValidationResult {
  const env = getEnv();
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required');
  } else if (!env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase')) {
    warnings.push('NEXT_PUBLIC_SUPABASE_URL does not look like a Supabase URL');
  }

  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }

  // Production requirements
  if (env.NODE_ENV === 'production') {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is required in production');
    }

    if (!env.TOSS_SECRET_KEY) {
      warnings.push('TOSS_SECRET_KEY not set - payments will not work');
    }

    if (!env.TOSS_WEBHOOK_SECRET) {
      warnings.push('TOSS_WEBHOOK_SECRET not set - webhook verification disabled');
    }

    if (!env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
      warnings.push('VAPID keys not set - push notifications will not work');
    }
  }

  // Development warnings
  if (env.NODE_ENV === 'development') {
    if (!env.NEXT_PUBLIC_TOSS_CLIENT_KEY) {
      warnings.push('NEXT_PUBLIC_TOSS_CLIENT_KEY not set - using test mode');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log environment status
 */
export function logEnvStatus(): void {
  const result = validateEnv();
  const env = getEnv();

  console.log('\n🔧 Environment Configuration Status');
  console.log('='.repeat(50));
  console.log(`Mode: ${env.NODE_ENV}`);

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(e => console.log(`   - ${e}`));
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(w => console.log(`   - ${w}`));
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('\n✅ All environment variables configured correctly');
  }

  console.log('='.repeat(50) + '\n');
}

/**
 * Check if a feature is enabled based on env vars
 */
export const features = {
  payments: () => !!getEnv().NEXT_PUBLIC_TOSS_CLIENT_KEY && !!getEnv().TOSS_SECRET_KEY,
  pushNotifications: () => !!getEnv().NEXT_PUBLIC_VAPID_PUBLIC_KEY && !!getEnv().VAPID_PRIVATE_KEY,
  webhooks: () => !!getEnv().TOSS_WEBHOOK_SECRET,
} as const;
