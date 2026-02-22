import { vi } from 'vitest';
import '@testing-library/jest-dom';

// 환경변수 모킹
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.CRON_SECRET = 'test-cron-secret';
process.env.ADMIN_SECRET = 'test-admin-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_12345';
process.env.TOSSPAYMENTS_SECRET_KEY = 'test-toss-key';
