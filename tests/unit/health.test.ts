import { describe, it, expect, vi } from 'vitest';

// ── Mock supabase ──
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

describe('GET /api/health', () => {
  it('응답에 status 필드가 있다', async () => {
    const res = await GET();
    const body = await res.json();
    expect(['ok', 'degraded', 'down']).toContain(body.status);
  });

  it('응답에 components 객체가 있다', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.components).toHaveProperty('api');
    expect(body.components).toHaveProperty('database');
    expect(body.components).toHaveProperty('env');
    expect(body.components).toHaveProperty('ai');
    expect(body.components).toHaveProperty('billing');
    expect(body.components).toHaveProperty('email');
  });

  it('응답에 timestamp와 version이 있다', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('latencyMs');
  });

  it('응답에 시크릿 정보가 없다', async () => {
    const res = await GET();
    const text = JSON.stringify(await res.json());
    expect(text).not.toMatch(/sk_/);
    expect(text).not.toMatch(/SERVICE_ROLE_KEY/);
    expect(text).not.toMatch(/OPENAI_API_KEY/);
  });

  it('Cache-Control 헤더가 public, max-age=60이다', async () => {
    const res = await GET();
    expect(res.headers.get('Cache-Control')).toContain('public');
    expect(res.headers.get('Cache-Control')).toContain('max-age=60');
  });
});
