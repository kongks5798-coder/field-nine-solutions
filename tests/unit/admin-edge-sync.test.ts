// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/core/adminAuth', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({ from: mocks.mockFrom })),
}));

import { GET, POST } from '@/app/api/admin/edge-sync/route';

// ── 인증 결과 상수 ──────────────────────────────────────────────────────────
const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
};

function makeGetReq() {
  return new NextRequest('http://localhost/api/admin/edge-sync');
}

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/edge-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── 체인 모킹 헬퍼 ─────────────────────────────────────────────────────────
/** edge_sync_log: select → order → limit */
function mockSyncLogsQuery(data: unknown[] | null) {
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data }),
      }),
    }),
  };
}

/** edge_sync_log: insert → select → single */
function mockInsertQuery(data: unknown | null, error: { message: string } | null = null) {
  return {
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
  };
}

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('/api/admin/edge-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  describe('GET', () => {
    it('인증 실패 시 403 반환', async () => {
      mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
      const res = await GET(makeGetReq());
      expect(res.status).toBe(403);
    });

    it('노드별 통계 집계', async () => {
      const syncLogs = [
        { edge_node_id: 'node-a', status: 'completed', records_synced: 100, started_at: '2024-01-15T10:00:00Z' },
        { edge_node_id: 'node-a', status: 'completed', records_synced: 50, started_at: '2024-01-15T09:00:00Z' },
        { edge_node_id: 'node-a', status: 'failed', records_synced: 0, started_at: '2024-01-15T08:00:00Z' },
        { edge_node_id: 'node-b', status: 'completed', records_synced: 200, started_at: '2024-01-15T07:00:00Z' },
      ];
      mocks.mockFrom.mockReturnValue(mockSyncLogsQuery(syncLogs));

      const res = await GET(makeGetReq());
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.nodes).toHaveLength(2);

      const nodeA = body.nodes.find((n: { nodeId: string }) => n.nodeId === 'node-a');
      expect(nodeA.total).toBe(3);
      expect(nodeA.completed).toBe(2);
      expect(nodeA.failed).toBe(1);
      expect(nodeA.records).toBe(150);

      const nodeB = body.nodes.find((n: { nodeId: string }) => n.nodeId === 'node-b');
      expect(nodeB.total).toBe(1);
      expect(nodeB.completed).toBe(1);
      expect(nodeB.records).toBe(200);
    });

    it('최근 로그 반환', async () => {
      const syncLogs = [
        { edge_node_id: 'node-a', status: 'completed', records_synced: 100, started_at: '2024-01-15T10:00:00Z' },
      ];
      mocks.mockFrom.mockReturnValue(mockSyncLogsQuery(syncLogs));

      const res = await GET(makeGetReq());
      const body = await res.json();

      expect(body.recentLogs).toHaveLength(1);
      expect(body.recentLogs[0].edge_node_id).toBe('node-a');
    });

    it('성공/실패 카운트 정확성', async () => {
      const syncLogs = [
        { edge_node_id: 'node-x', status: 'completed', records_synced: 10, started_at: '2024-01-15T10:00:00Z' },
        { edge_node_id: 'node-x', status: 'completed', records_synced: 20, started_at: '2024-01-15T09:00:00Z' },
        { edge_node_id: 'node-x', status: 'failed', records_synced: 0, started_at: '2024-01-15T08:00:00Z' },
        { edge_node_id: 'node-x', status: 'failed', records_synced: 0, started_at: '2024-01-15T07:00:00Z' },
        { edge_node_id: 'node-x', status: 'completed', records_synced: 30, started_at: '2024-01-15T06:00:00Z' },
      ];
      mocks.mockFrom.mockReturnValue(mockSyncLogsQuery(syncLogs));

      const res = await GET(makeGetReq());
      const body = await res.json();

      const node = body.nodes[0];
      expect(node.total).toBe(5);
      expect(node.completed).toBe(3);
      expect(node.failed).toBe(2);
      expect(node.records).toBe(60); // 10 + 20 + 0 + 0 + 30
    });
  });

  describe('POST', () => {
    it('동기화 트리거 성공', async () => {
      mocks.mockFrom.mockReturnValue(
        mockInsertQuery({ id: 'sync-001', edge_node_id: 'node-a', table_name: 'users', status: 'pending' }),
      );

      const res = await POST(makePostReq({ edgeNodeId: 'node-a', tableName: 'users' }));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.syncId).toBe('sync-001');
    });

    it('edgeNodeId 누락 시 400 반환', async () => {
      const res = await POST(makePostReq({ tableName: 'users' }));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe('edgeNodeId and tableName required');
    });

    it('DB 에러 시 500 반환', async () => {
      mocks.mockFrom.mockReturnValue(
        mockInsertQuery(null, { message: 'insert failed' }),
      );

      const res = await POST(makePostReq({ edgeNodeId: 'node-a', tableName: 'users' }));
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe('Failed to sync edge data');
    });
  });
});
