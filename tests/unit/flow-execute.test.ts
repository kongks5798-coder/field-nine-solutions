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

function makeReqInvalidJson() {
  return new NextRequest('http://localhost/api/flow/execute', {
    method: 'POST',
    body: 'not-json{{{',
    headers: { 'Content-Type': 'application/json' },
  });
}

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }

// Helper: a simple trigger node
function triggerNode(id = 'trigger-1') {
  return {
    id,
    type: 'trigger' as const,
    label: 'Start',
    config: { cron: '0 * * * *' },
    position: { x: 0, y: 0 },
  };
}

// Helper: a transform node
function transformNode(id = 'transform-1', template = '{{prev.triggeredAt}}') {
  return {
    id,
    type: 'transform' as const,
    label: 'Transform',
    config: { template },
    position: { x: 100, y: 0 },
  };
}

// Helper: a condition node
function conditionNode(id = 'condition-1', field = 'prev.type', operator = '==', value = 'manual') {
  return {
    id,
    type: 'condition' as const,
    label: 'Check',
    config: { field, operator, value },
    position: { x: 200, y: 0 },
  };
}

// Helper: an edge
function edge(source: string, target: string, id?: string) {
  return { id: id ?? `${source}-${target}`, source, target };
}

describe('POST /api/flow/execute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makeReq({ nodes: [triggerNode()], edges: [] }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('잘못된 JSON → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makeReqInvalidJson());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid JSON body');
  });

  it('노드 없음 → 400 validation 오류', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makeReq({ nodes: [], edges: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  it('잘못된 노드 타입 → 400 validation 오류', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const invalidNode = {
      id: 'n1',
      type: 'invalid_type',
      label: 'Bad',
      config: {},
      position: { x: 0, y: 0 },
    };
    const res = await POST(makeReq({ nodes: [invalidNode], edges: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  it('노드 id 누락 → 400 validation 오류', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const noIdNode = {
      id: '',
      type: 'trigger',
      label: 'Empty ID',
      config: {},
      position: { x: 0, y: 0 },
    };
    const res = await POST(makeReq({ nodes: [noIdNode], edges: [] }));
    expect(res.status).toBe(400);
  });

  it('단일 trigger 노드 실행 성공', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makeReq({ nodes: [triggerNode()], edges: [] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].status).toBe('success');
    expect(body.results[0].nodeId).toBe('trigger-1');
    expect(body.results[0].output).toHaveProperty('triggeredAt');
    expect(body.results[0].output.type).toBe('manual');
    expect(body.totalDuration).toBeGreaterThanOrEqual(0);
  });

  it('trigger → transform 체인 실행', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const nodes = [triggerNode(), transformNode()];
    const edges = [edge('trigger-1', 'transform-1')];

    const res = await POST(makeReq({ nodes, edges }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.results).toHaveLength(2);
    expect(body.results[0].status).toBe('success');
    expect(body.results[1].status).toBe('success');
    // Transform should have processed the trigger output
    expect(body.results[1].output).toBeDefined();
  });

  it('trigger → condition 노드 실행 (pass: true)', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const nodes = [triggerNode(), conditionNode()];
    const edges = [edge('trigger-1', 'condition-1')];

    const res = await POST(makeReq({ nodes, edges }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.results).toHaveLength(2);
    // Trigger output has type: 'manual', condition checks prev.type == 'manual'
    expect(body.results[1].output.pass).toBe(true);
  });

  it('condition 노드 (pass: false)', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const nodes = [triggerNode(), conditionNode('cond-1', 'prev.type', '==', 'scheduled')];
    const edges = [edge('trigger-1', 'cond-1')];

    const res = await POST(makeReq({ nodes, edges }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // Trigger type is 'manual', not 'scheduled'
    expect(body.results[1].output.pass).toBe(false);
  });

  it('순환 그래프 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const nodes = [
      triggerNode('a'),
      transformNode('b'),
    ];
    const edges = [
      edge('a', 'b'),
      edge('b', 'a'), // cycle
    ];

    const res = await POST(makeReq({ nodes, edges }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('cycle');
  });

  it('Supabase 미설정 시 인증 없이 실행됨', async () => {
    // When supabase URL is placeholder, auth is skipped
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
    const res = await POST(makeReq({ nodes: [triggerNode()], edges: [] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('transform 노드 - 객체 템플릿 처리', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const nodes = [
      triggerNode(),
      {
        id: 'transform-obj',
        type: 'transform' as const,
        label: 'Object Transform',
        config: { template: { key: '{{prev.type}}' } },
        position: { x: 100, y: 0 },
      },
    ];
    const edges = [edge('trigger-1', 'transform-obj')];

    const res = await POST(makeReq({ nodes, edges }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.results[1].output).toEqual({ key: 'manual' });
  });

  it('transform 노드 - 템플릿 없으면 prev passthrough', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const nodes = [
      triggerNode(),
      {
        id: 'transform-passthru',
        type: 'transform' as const,
        label: 'Passthrough',
        config: {},
        position: { x: 100, y: 0 },
      },
    ];
    const edges = [edge('trigger-1', 'transform-passthru')];

    const res = await POST(makeReq({ nodes, edges }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[1].output).toHaveProperty('triggeredAt');
  });
});
