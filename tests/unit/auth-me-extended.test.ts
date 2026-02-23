// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── vi.hoisted mocks ──
const mockGetSession = vi.hoisted(() => vi.fn());
const mockSingle     = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn().mockReturnValue([]) }),
}));

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
    })),
  })),
}));

import { GET } from '@/app/api/auth/me/route';

const NO_SESSION = { data: { session: null } };

function sessionOf(uid: string, email: string, metadata?: Record<string, unknown>) {
  return {
    data: {
      session: {
        user: {
          id: uid,
          email,
          user_metadata: { full_name: 'Test User', avatar_url: 'https://example.com/a.png', ...metadata },
        },
      },
    },
  };
}

function makeReq(method: string, body?: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/me', { method });
}

describe('GET /api/auth/me — extended edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(NO_SESSION);
    mockSingle.mockResolvedValue({
      data: {
        plan: 'pro',
        plan_expires_at: '2026-12-31T00:00:00Z',
        name: 'Test User',
        avatar_url: 'https://example.com/a.png',
        trial_ends_at: null,
        trial_converted: false,
      },
      error: null,
    });
  });

  it('no session returns { user: null } with 200 status', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeNull();
  });

  it('valid session returns user data with id and email', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-me-1', 'me@example.com'));
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toMatchObject({
      id: 'uid-me-1',
      email: 'me@example.com',
    });
  });

  it('response includes plan info from profile', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-plan', 'plan@example.com'));
    const res = await GET(makeReq('GET'));
    const body = await res.json();
    expect(body.plan).toBe('pro');
    expect(body.planExpiresAt).toBe('2026-12-31T00:00:00Z');
  });

  it('Cache-Control header is set to no-store', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-cache', 'cache@example.com'));
    const res = await GET(makeReq('GET'));
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('missing profile data falls back to user_metadata for name and avatar', async () => {
    mockSingle.mockResolvedValue({
      data: {
        plan: null,
        plan_expires_at: null,
        name: null,
        avatar_url: null,
        trial_ends_at: null,
        trial_converted: false,
      },
      error: null,
    });
    mockGetSession.mockResolvedValue(sessionOf('uid-fallback', 'fb@example.com', {
      full_name: 'Fallback Name',
      avatar_url: 'https://example.com/fallback.png',
    }));

    const res = await GET(makeReq('GET'));
    const body = await res.json();
    expect(body.user.name).toBe('Fallback Name');
    expect(body.user.avatarUrl).toBe('https://example.com/fallback.png');
    expect(body.plan).toBeNull();
  });

  it('expired trial shows trialDaysLeft as 0 and onTrial as false', async () => {
    const pastDate = new Date(Date.now() - 86_400_000).toISOString();
    mockSingle.mockResolvedValue({
      data: {
        plan: 'free',
        plan_expires_at: null,
        name: 'Expired',
        avatar_url: null,
        trial_ends_at: pastDate,
        trial_converted: false,
      },
      error: null,
    });
    mockGetSession.mockResolvedValue(sessionOf('uid-expired', 'expired@test.com'));

    const res = await GET(makeReq('GET'));
    const body = await res.json();
    expect(body.trialDaysLeft).toBe(0);
    expect(body.onTrial).toBe(false);
  });

  it('active trial shows correct trialDaysLeft and onTrial true', async () => {
    const futureDate = new Date(Date.now() + 3 * 86_400_000).toISOString();
    mockSingle.mockResolvedValue({
      data: {
        plan: 'free',
        plan_expires_at: null,
        name: 'Trialer',
        avatar_url: null,
        trial_ends_at: futureDate,
        trial_converted: false,
      },
      error: null,
    });
    mockGetSession.mockResolvedValue(sessionOf('uid-active-trial', 'trial@test.com'));

    const res = await GET(makeReq('GET'));
    const body = await res.json();
    expect(body.trialDaysLeft).toBeGreaterThanOrEqual(2);
    expect(body.trialDaysLeft).toBeLessThanOrEqual(3);
    expect(body.onTrial).toBe(true);
    expect(body.trialConverted).toBe(false);
  });

  it('trial_converted true means onTrial is false even with future trial_ends_at', async () => {
    const futureDate = new Date(Date.now() + 10 * 86_400_000).toISOString();
    mockSingle.mockResolvedValue({
      data: {
        plan: 'pro',
        plan_expires_at: '2026-12-31T00:00:00Z',
        name: 'Converted',
        avatar_url: null,
        trial_ends_at: futureDate,
        trial_converted: true,
      },
      error: null,
    });
    mockGetSession.mockResolvedValue(sessionOf('uid-converted', 'converted@test.com'));

    const res = await GET(makeReq('GET'));
    const body = await res.json();
    expect(body.trialConverted).toBe(true);
    expect(body.onTrial).toBe(false);
  });

  it('DB error on trial query is gracefully handled with defaults', async () => {
    let callCount = 0;
    mockSingle.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          data: { plan: 'free', plan_expires_at: null, name: 'Grace', avatar_url: null },
          error: null,
        });
      }
      return Promise.resolve({
        data: null,
        error: { message: 'column trial_ends_at does not exist', code: '42703' },
      });
    });
    mockGetSession.mockResolvedValue(sessionOf('uid-graceful', 'grace@test.com'));

    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trialEndsAt).toBeNull();
    expect(body.trialConverted).toBe(false);
    expect(body.trialDaysLeft).toBeNull();
    expect(body.onTrial).toBe(false);
  });
});
