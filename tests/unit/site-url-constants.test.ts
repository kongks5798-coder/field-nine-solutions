// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

describe('SITE_URL constant', () => {
  it('defaults to https://fieldnine.io', async () => {
    // Ensure env override is absent
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.resetModules();
    const { SITE_URL } = await import('@/lib/constants');
    expect(SITE_URL).toBe('https://fieldnine.io');
  });

  it('is a valid HTTPS URL', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.resetModules();
    const { SITE_URL } = await import('@/lib/constants');
    const url = new URL(SITE_URL);
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe('fieldnine.io');
  });

  it('respects NEXT_PUBLIC_SITE_URL env override', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.fieldnine.io';
    vi.resetModules();
    const { SITE_URL } = await import('@/lib/constants');
    expect(SITE_URL).toBe('https://staging.fieldnine.io');
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });
});
