// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), api: vi.fn(), security: vi.fn(), billing: vi.fn(), auth: vi.fn() },
}));

const mockGetSession = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}));

import { POST } from '@/app/api/flow/execute/route';

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/flow/execute', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }

function node(id: string, type: string, config: Record<string, unknown> = {}) {
  return { id, type, label: id, config, position: { x: 0, y: 0 } };
}

function edge(source: string, target: string) {
  return { id: `${source}-${target}`, source, target };
}

describe('POST /api/flow/execute advanced scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('send_email node without RESEND_API_KEY returns mock result', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    delete process.env.RESEND_API_KEY;
    const nodes = [
      node('t', 'trigger', {}),
      node('email', 'send_email', { to: 'test@test.com', subject: 'Hello', body: 'World' }),
    ];
    const edges = [edge('t', 'email')];
    const res = await POST(makeReq({ nodes, edges }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.results[1].status).toBe('success');
    expect(body.results[1].output.mock).toBe(true);
    expect(body.results[1].output.sent).toBe(false);
  });

  it('send_email node with missing to field causes error', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    delete process.env.RESEND_API_KEY;
    const nodes = [
      node('t', 'trigger', {}),
      node('email', 'send_email', { subject: 'No To', body: 'Body' }),
    ];
    const edges = [edge('t', 'email')];
    const res = await POST(makeReq({ nodes, edges }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.results[1].status).toBe('error');
    expect(body.results[1].error).toContain('to');
  });

  it('upstream error causes downstream node to be skipped', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    delete process.env.RESEND_API_KEY;
    const nodes = [
      node('t', 'trigger', {}),
      node('email', 'send_email', {}),
      node('transform', 'transform', { template: '{{prev}}' }),
    ];
    const edges = [edge('t', 'email'), edge('email', 'transform')];
    const res = await POST(makeReq({ nodes, edges }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[1].status).toBe('error');
    expect(body.results[2].status).toBe('skipped');
  });

  it('condition node with not_equals operator', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const nodes = [
      node('t', 'trigger', {}),
      node('cond', 'condition', { field: 'prev.type', operator: 'not_equals', value: 'manual' }),
    ];
    const edges = [edge('t', 'cond')];
    const res = await POST(makeReq({ nodes, edges }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[1].output.pass).toBe(false);
    expect(body.results[1].output.operator).toBe('not_equals');
  });

  it('condition node with contains operator', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const nodes = [
      node('t', 'trigger', { path: '/api/test' }),
      node('cond', 'condition', { field: 'prev.type', operator: 'contains', value: 'man' }),
    ];
    const edges = [edge('t', 'cond')];
    const res = await POST(makeReq({ nodes, edges }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[1].output.pass).toBe(true);
  });
});
