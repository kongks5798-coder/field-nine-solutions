/**
 * 환경 변수 검증 테스트
 */

describe('Environment Variable Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should validate required client environment variables', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

    const { validateClientEnv } = require('@/src/utils/env');
    
    expect(() => validateClientEnv()).not.toThrow();
  });

  it('should throw error when client environment variables are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { validateClientEnv } = require('@/src/utils/env');
    
    expect(() => validateClientEnv()).toThrow();
  });

  it('should validate required server environment variables', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

    const { validateServerEnv } = require('@/src/utils/env');
    
    expect(() => validateServerEnv()).not.toThrow();
  });
});
