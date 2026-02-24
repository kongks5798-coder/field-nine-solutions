// @vitest-environment node
/**
 * flow-execute-extended.test.ts
 *
 * Additional edge-case tests for POST /api/flow/execute:
 * 1. Auth check — 401 when Supabase is configured and no session
 * 2. Validation: nodes array with > 50 items → 400
 * 3. http_request node with missing url config → error result
 * 4. http_request node with invalid protocol → error result
 * 5. Multiple disconnected trigger nodes (no edges) all execute
 * 6. Condition node with unsupported operator defaults to false
 */
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

function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function node(id: string, type: string, config: Record<string, unknown> = {}) {
  return { id, type, label: id, config, position: { x: 0, y: 0 } };
}

function edge(source: string, target: string) {
  return { id: `${source}-${target}`, source, target };
}

describe('POST /api/flow/execute (extended edge cases)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('returns 401 when Supabase is configured and session is null', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const res = await POST(makeReq({ nodes: [node('t', 'trigger')], edges: [] }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('rejects payload with more than 50 nodes (Zod max)', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const nodes = Array.from({ length: 51 }, (_, i) =>
      node(`n${i}`, 'trigger'),
    );
    const res = await POST(makeReq({ nodes, edges: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  it('http_request node with empty url config → error status in result', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const nodes = [
      node('t', 'trigger'),
      node('http', 'http_request', { url: '' }),
    ];
    const edges = [edge('t', 'http')];
    const res = await POST(makeReq({ nodes, edges }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.results[1].status).toBe('error');
    expect(body.results[1].error).toContain('url is required');
  });

  it('http_request node with ftp:// protocol → error about protocol not allowed', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const nodes = [
      node('t', 'trigger'),
      node('http', 'http_request', { url: 'ftp://example.com/file' }),
    ];
    const edges = [edge('t', 'http')];
    const res = await POST(makeReq({ nodes, edges }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.results[1].status).toBe('error');
    expect(body.results[1].error).toContain('protocol');
    expect(body.results[1].error).toContain('not allowed');
  });

  it('multiple disconnected trigger nodes all execute successfully', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const nodes = [
      node('t1', 'trigger', { path: '/a' }),
      node('t2', 'trigger', { path: '/b' }),
      node('t3', 'trigger', { path: '/c' }),
    ];
    const res = await POST(makeReq({ nodes, edges: [] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.results).toHaveLength(3);
    expect(body.results.every((r: { status: string }) => r.status === 'success')).toBe(true);
  });

  it('condition node with unsupported operator defaults to pass=false', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const nodes = [
      node('t', 'trigger'),
      node('cond', 'condition', { field: 'prev.type', operator: 'regex_match', value: '.*' }),
    ];
    const edges = [edge('t', 'cond')];
    const res = await POST(makeReq({ nodes, edges }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[1].status).toBe('success');
    expect(body.results[1].output.pass).toBe(false);
  });
});
