// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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
vi.mock('@/core/self-heal', () => ({
  measureSelfHeal: vi.fn(async (_key: string, _method: string, fn: () => Promise<unknown>) => ({
    result: await fn(),
    cache: 'no-cache',
  })),
}));

import { GET, POST } from '@/app/api/admin/customers/route';
import { DELETE, PATCH } from '@/app/api/admin/customers/[id]/route';

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

describe('admin/customers extended edge cases', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
    mocks.db.listCustomers.mockResolvedValue([]);
    mocks.db.createCustomer.mockResolvedValue({ id: 'c_new', name: 'Test', email: 'test@test.com' });
    mocks.db.deleteCustomer.mockResolvedValue(true);
    mocks.db.updateCustomer.mockResolvedValue({ id: 'c1', name: 'Updated', email: 'upd@test.com' });
  });

  it('GET returns empty customers array', async () => {
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.customers).toEqual([]);
  });

  it('POST with empty name string returns 400', async () => {
    const res = await POST(makeReq('POST', { name: '', email: 'test@test.com' }));
    expect(res.status).toBe(400);
  });

  it('POST with email exceeding 254 chars returns 400', async () => {
    const longEmail = 'a'.repeat(250) + '@b.co';
    const res = await POST(makeReq('POST', { name: 'Test', email: longEmail }));
    expect(res.status).toBe(400);
  });

  it('PATCH with name at 100 char boundary returns 200', async () => {
    const res = await PATCH(makeIdReq('PATCH', { name: 'A'.repeat(100) }), ctx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('PATCH with name at 101 chars returns 400', async () => {
    const res = await PATCH(makeIdReq('PATCH', { name: 'A'.repeat(101) }), ctx());
    expect(res.status).toBe(400);
  });
});
