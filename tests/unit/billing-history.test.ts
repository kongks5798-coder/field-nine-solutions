import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetSession = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: mockFrom,
  })),
}));

import { GET } from '@/app/api/billing/history/route';

function makeReq() {
  return new NextRequest('http://localhost/api/billing/history', { method: 'GET' });
}

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }

const MONTHLY = [{ billing_period: '2024-01', ai_calls: 10, amount_krw: 9900, status: 'paid', stripe_invoice_id: 'inv_1' }];
const EVENTS = [{ id: 'ev-1', type: 'subscription_created', amount: 9900, description: '구독 시작', created_at: '2024-01-01' }];

function setupMock(monthly: unknown, events: unknown) {
  let callCount = 0;
  mockFrom.mockImplementation(() => {
    callCount++;
    const call = callCount;
    const result = call === 1 ? { data: monthly } : { data: events };
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(result),
          }),
        }),
      }),
    };
  });
}

describe('GET /api/billing/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('인증 성공 → monthly, events 배열 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    setupMock(MONTHLY, EVENTS);
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.monthly).toHaveLength(1);
    expect(body.events).toHaveLength(1);
  });

  it('데이터 없을 때 빈 배열 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-2'));
    setupMock(null, null);
    const res = await GET(makeReq());
    const body = await res.json();
    expect(body.monthly).toEqual([]);
    expect(body.events).toEqual([]);
  });
});
