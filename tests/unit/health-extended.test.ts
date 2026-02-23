// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

// Mock supabase
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'test' }, error: null }),
        })),
      })),
    })),
  })),
}));

import { GET } from '@/app/api/health/route';

describe('GET /api/health extended edge cases', () => {
  it('Response Content-Type is application/json', async () => {
    const res = await GET();
    const ct = res.headers.get('Content-Type');
    expect(ct).toMatch(/application\/json/);
  });

  it('latencyMs is a non-negative number', async () => {
    const res = await GET();
    const body = await res.json();
    expect(typeof body.latencyMs).toBe('number');
    expect(body.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('timestamp is a valid ISO-8601 string', async () => {
    const res = await GET();
    const body = await res.json();
    const parsed = new Date(body.timestamp);
    expect(parsed.toISOString()).toBe(body.timestamp);
  });

  it('version matches semver-like pattern', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('api component is always ok self-check', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.components.api.status).toBe('ok');
  });

  it('X-Content-Type-Options nosniff header is set', async () => {
    const res = await GET();
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('database component includes latencyMs field', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.components.database).toHaveProperty('latencyMs');
    expect(typeof body.components.database.latencyMs).toBe('number');
  });
});
