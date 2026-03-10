// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Supabase mock (healthy DB) ──
const mockMaybeSingle = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
      })),
    })),
  })),
}));

// validateEnv is tested separately; mock so env keys don't affect results
vi.mock('@/lib/validateEnv', () => ({
  getEnvStatus: vi.fn(() => ({
    supabase: true,
    anthropic: true,
    openai: false,
    resend: true,
    cronSecret: true,
    tossPayments: true,
    sentry: false,
  })),
}));

import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: DB healthy
    mockMaybeSingle.mockResolvedValue({ data: { id: 'test-row' }, error: null });
    // Supabase URL must not be placeholder for envOk to be true
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://gflbuujjotqpflrbgtpd.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key-test';
  });

  // ── Status & shape ───────────────────────────────────────────────
  it('returns 200 when DB is healthy', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('body has a services object with expected keys', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveProperty('services');
    expect(body.services).toHaveProperty('supabase');
    expect(body.services).toHaveProperty('ai');
    expect(body.services).toHaveProperty('email');
    expect(body.services).toHaveProperty('payments');
  });

  it('services values are all booleans', async () => {
    const res = await GET();
    const body = await res.json();
    for (const [key, val] of Object.entries(body.services)) {
      expect(typeof val, `services.${key} should be boolean`).toBe('boolean');
    }
  });

  it('env object values are all booleans (no secrets leaked)', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveProperty('env');
    for (const [key, val] of Object.entries(body.env)) {
      expect(typeof val, `env.${key} should be boolean`).toBe('boolean');
    }
  });

  it('no sensitive key values are present in the response body', async () => {
    const res = await GET();
    const raw = JSON.stringify(await res.json());
    // Must not contain patterns that look like real secrets
    expect(raw).not.toMatch(/sk-ant-/);
    expect(raw).not.toMatch(/sk_live_/);
    expect(raw).not.toMatch(/SERVICE_ROLE_KEY/);
    expect(raw).not.toMatch(/OPENAI_API_KEY/);
  });

  it('status is "ok" when DB is healthy and env is configured', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  // ── Degraded / Down ──────────────────────────────────────────────
  it('returns degraded status when DB throws an error', async () => {
    mockMaybeSingle.mockRejectedValueOnce(new Error('connection refused'));
    const res = await GET();
    const body = await res.json();
    // status should be 'down' or 'degraded' (not 'ok')
    expect(body.status).not.toBe('ok');
    expect(body.services.supabase).toBe(false);
  });

  it('HTTP status is 503 when DB is unavailable', async () => {
    mockMaybeSingle.mockRejectedValueOnce(new Error('timeout'));
    const res = await GET();
    expect(res.status).toBe(503);
  });

  // ── Cache headers ────────────────────────────────────────────────
  it('Cache-Control header includes public and max-age=60', async () => {
    const res = await GET();
    const cc = res.headers.get('Cache-Control') ?? '';
    expect(cc).toContain('public');
    expect(cc).toContain('max-age=60');
  });

  it('X-Content-Type-Options is nosniff', async () => {
    const res = await GET();
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});
