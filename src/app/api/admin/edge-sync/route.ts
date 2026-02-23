import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { getAdminClient } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const sb = getAdminClient();

  const { data: syncLogs } = await sb
    .from("edge_sync_log")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(100);

  // 노드별 통계
  const nodes: Record<
    string,
    { total: number; completed: number; failed: number; lastSync: string; records: number }
  > = {};

  for (const log of syncLogs ?? []) {
    const nodeId = log.edge_node_id as string;
    if (!nodes[nodeId]) {
      nodes[nodeId] = { total: 0, completed: 0, failed: 0, lastSync: log.started_at, records: 0 };
    }
    const n = nodes[nodeId];
    n.total++;
    if (log.status === "completed") n.completed++;
    if (log.status === "failed") n.failed++;
    n.records += (log.records_synced as number) ?? 0;
    if (log.started_at > n.lastSync) n.lastSync = log.started_at;
  }

  return NextResponse.json({
    nodes: Object.entries(nodes).map(([id, v]) => ({ nodeId: id, ...v })),
    recentLogs: syncLogs ?? [],
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const sb = getAdminClient();
  const body = await req.json();
  const { edgeNodeId, tableName, direction } = body;

  if (!edgeNodeId || !tableName) {
    return NextResponse.json({ error: "edgeNodeId and tableName required" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("edge_sync_log")
    .insert({
      edge_node_id: edgeNodeId,
      table_name: tableName,
      sync_direction: direction ?? "push",
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to sync edge data" }, { status: 500 });
  return NextResponse.json({ success: true, syncId: data.id });
}
