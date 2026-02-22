import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  db: {
    listCustomers: vi.fn(),
    createCustomer: vi.fn(),
    deleteCustomer: vi.fn(),
    updateCustomer: vi.fn(),
  },
}));

vi.mock('@/core/adminAuth', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: () => '127.0.0.1',
  checkLimit: () => ({ ok: true, remaining: 9, limit: 10, reset: Date.now() + 60000 }),
  headersFor: () => ({}),
}));
vi.mock('@/core/database', () => ({ getDB: () => mocks.db }));

import { GET, POST } from '@/app/api/admin/customers/route';
import { DELETE, PATCH } from '@/app/api/admin/customers/[id]/route';

// ── Helpers ────────────────────────────────────────────────────────────────
function makeReq(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/admin/customers', {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
function makeIdReq(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/admin/customers/c1', {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
function ctx(id = 'c1') {
  return { params: Promise.resolve({ id }) };
}

const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
};

// ── Setup ──────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue(AUTH_OK);
  mocks.db.listCustomers.mockResolvedValue([
    { id: 'c1', name: '홍길동', email: 'hong@test.com' },
  ]);
  mocks.db.createCustomer.mockResolvedValue({ id: 'c_123', name: '홍길동', email: 'hong@test.com' });
  mocks.db.deleteCustomer.mockResolvedValue(true);
  mocks.db.updateCustomer.mockResolvedValue({ id: 'c1', name: 'Updated', email: 'upd@test.com' });
});

// ── GET /api/admin/customers ───────────────────────────────────────────────
describe('GET /api/admin/customers', () => {
  it('인증 성공 → 200 + customers 배열', async () => {
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.customers)).toBe(true);
    expect(body.customers).toHaveLength(1);
  });

  it('인증 실패 → 401', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(401);
  });
});

// ── POST /api/admin/customers ──────────────────────────────────────────────
describe('POST /api/admin/customers', () => {
  it('유효한 body → 200 + customer', async () => {
    const res = await POST(makeReq('POST', { name: '홍길동', email: 'hong@test.com' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.customer).toBeDefined();
  });

  it('name 누락 → 400', async () => {
    const res = await POST(makeReq('POST', { email: 'hong@test.com' }));
    expect(res.status).toBe(400);
  });

  it('email 누락 → 400', async () => {
    const res = await POST(makeReq('POST', { name: '홍길동' }));
    expect(res.status).toBe(400);
  });

  it('이메일 형식 오류 → 400', async () => {
    const res = await POST(makeReq('POST', { name: '홍길동', email: 'not-an-email' }));
    expect(res.status).toBe(400);
  });

  it('name 100자 초과 → 400', async () => {
    const res = await POST(makeReq('POST', { name: 'a'.repeat(101), email: 'x@test.com' }));
    expect(res.status).toBe(400);
  });

  it('인증 실패 → 401', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await POST(makeReq('POST', { name: '홍길동', email: 'hong@test.com' }));
    expect(res.status).toBe(401);
  });
});

// ── DELETE /api/admin/customers/[id] ──────────────────────────────────────
describe('DELETE /api/admin/customers/[id]', () => {
  it('존재하는 고객 삭제 → 200', async () => {
    const res = await DELETE(makeIdReq('DELETE'), ctx());
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it('존재하지 않는 고객 → 404', async () => {
    mocks.db.deleteCustomer.mockResolvedValueOnce(false);
    const res = await DELETE(makeIdReq('DELETE'), ctx('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('인증 실패 → 401', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await DELETE(makeIdReq('DELETE'), ctx());
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/admin/customers/[id] ───────────────────────────────────────
describe('PATCH /api/admin/customers/[id]', () => {
  it('name만 수정 → 200', async () => {
    const res = await PATCH(makeIdReq('PATCH', { name: '김민준' }), ctx());
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it('email만 수정 → 200', async () => {
    const res = await PATCH(makeIdReq('PATCH', { email: 'new@test.com' }), ctx());
    expect(res.status).toBe(200);
  });

  it('name + email 동시 수정 → 200', async () => {
    const res = await PATCH(makeIdReq('PATCH', { name: '김민준', email: 'new@test.com' }), ctx());
    expect(res.status).toBe(200);
  });

  it('빈 body (name, email 둘 다 없음) → 400', async () => {
    const res = await PATCH(makeIdReq('PATCH', {}), ctx());
    expect(res.status).toBe(400);
  });

  it('이메일 형식 오류 → 400', async () => {
    const res = await PATCH(makeIdReq('PATCH', { email: 'bad-email' }), ctx());
    expect(res.status).toBe(400);
  });

  it('고객 없음 → 404', async () => {
    mocks.db.updateCustomer.mockResolvedValueOnce(null);
    const res = await PATCH(makeIdReq('PATCH', { name: '김민준' }), ctx('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('인증 실패 → 401', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await PATCH(makeIdReq('PATCH', { name: '김민준' }), ctx());
    expect(res.status).toBe(401);
  });
});
