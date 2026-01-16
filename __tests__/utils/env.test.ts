/**
 * 환경 변수 검증 테스트
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';

describe('Environment Variable Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should validate required client environment variables', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { validateClientEnv } = await import('@/src/utils/env');

    validateClientEnv();

    // Should not warn when env vars are present
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should warn when client environment variables are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { validateClientEnv } = await import('@/src/utils/env');

    validateClientEnv();

    // Should warn when env vars are missing (doesn't throw, just warns)
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should validate required server environment variables', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { validateServerEnv } = await import('@/src/utils/env');

    validateServerEnv();

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should throw when getEnv is called with missing required variable', async () => {
    delete process.env.TEST_VAR;

    const { getEnv } = await import('@/src/utils/env');

    expect(() => getEnv('TEST_VAR')).toThrow();
  });

  it('should return default value when getEnv is called with default', async () => {
    delete process.env.TEST_VAR;

    const { getEnv } = await import('@/src/utils/env');

    expect(getEnv('TEST_VAR', 'default')).toBe('default');
  });
});
