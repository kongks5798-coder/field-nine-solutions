"use client";
export const dynamic = "force-dynamic";

import { useState, useCallback } from "react";
import useSWR from "swr";
import AppShell from "@/components/AppShell";
import { T } from "@/lib/theme";

/* ── Types ──────────────────────────────────── */

type NodeStat = {
  nodeId: string;
  total: number;
  completed: number;
  failed: number;
  lastSync: string;
  records: number;
};

type SyncLog = {
  id: string;
  edge_node_id: string;
  table_name: string;
  sync_direction: string;
  status: string;
  records_synced: number | null;
  started_at: string;
  completed_at: string | null;
};

type EdgeSyncData = {
  nodes: NodeStat[];
  recentLogs: SyncLog[];
};

/* ── Helpers ────────────────────────────────── */

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r)));

const STATUS_COLORS: Record<string, string> = {
  completed: "#10b981",
  failed: "#ef4444",
  pending: "#f97316",
  syncing: "#3b82f6",
};

function fmtDate(iso: string | null) {
  if (!iso) return "--";
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/* ── Component ──────────────────────────────── */

export default function EdgeSyncPage() {
  const { data, isLoading, error: swrErr, mutate } = useSWR<EdgeSyncData>(
    "/api/admin/edge-sync",
    fetcher,
  );

  const nodes = data?.nodes ?? [];
  const logs = data?.recentLogs ?? [];

  /* ── KPI ── */
  const totalNodes = nodes.length;
  const totalCompleted = nodes.reduce((s, n) => s + n.completed, 0);
  const totalFailed = nodes.reduce((s, n) => s + n.failed, 0);
  const totalRecords = nodes.reduce((s, n) => s + n.records, 0);

  /* ── Form State ── */
  const [formNodeId, setFormNodeId] = useState("");
  const [formTable, setFormTable] = useState("");
  const [formDirection, setFormDirection] = useState<"push" | "pull">("push");
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  const handleSync = useCallback(async () => {
    if (!formNodeId.trim() || !formTable.trim()) {
      setFormMsg("노드 ID와 테이블명을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setFormMsg("");
    try {
      const res = await fetch("/api/admin/edge-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          edgeNodeId: formNodeId.trim(),
          tableName: formTable.trim(),
          direction: formDirection,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        setFormMsg(e.error ?? "동기화 요청 실패");
      } else {
        const d = await res.json();
        setFormMsg(`동기화 시작됨 (ID: ${d.syncId})`);
        setFormNodeId("");
        setFormTable("");
        mutate();
      }
    } catch {
      setFormMsg("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  }, [formNodeId, formTable, formDirection, mutate]);

  /* ── Styles ── */
  const inputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: "9px 14px",
    borderRadius: 8,
    border: `1px solid ${T.border}`,
    background: T.surface,
    color: T.text,
    fontSize: 13,
    outline: "none",
  };

  const kpiCard = (
    label: string,
    value: number | string,
    color: string,
  ): React.CSSProperties => ({
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 12,
    padding: "20px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  });

  return (
    <AppShell>
      <div
        style={{
          padding: "28px 32px",
          color: T.text,
          fontFamily: T.fontStack,
          maxWidth: 1400,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
              하이브리드 클라우드 오버사이트
            </h1>
            <p style={{ fontSize: 12, color: T.muted, margin: "4px 0 0" }}>
              엣지 노드 동기화 상태를 모니터링합니다
            </p>
          </div>
          <button
            onClick={() => mutate()}
            style={{
              background: "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.3)",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12,
              color: T.accent,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            새로고침
          </button>
        </div>

        {isLoading ? (
          <div style={{ color: T.muted, textAlign: "center", padding: 60 }}>
            로딩 중...
          </div>
        ) : swrErr ? (
          <div style={{ color: T.red, padding: 20 }}>데이터 로드 실패</div>
        ) : (
          <>
            {/* ── Section 1: KPI Cards ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 14,
                marginBottom: 32,
              }}
            >
              <div style={kpiCard("총 엣지 노드", totalNodes, T.accent)}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  총 엣지 노드
                </span>
                <span
                  style={{ fontSize: 28, fontWeight: 900, color: T.accent }}
                >
                  {totalNodes}
                </span>
              </div>
              <div style={kpiCard("완료 동기화", totalCompleted, T.green)}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  완료된 동기화
                </span>
                <span
                  style={{ fontSize: 28, fontWeight: 900, color: T.green }}
                >
                  {totalCompleted.toLocaleString()}
                </span>
              </div>
              <div style={kpiCard("실패 동기화", totalFailed, T.red)}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  실패한 동기화
                </span>
                <span style={{ fontSize: 28, fontWeight: 900, color: T.red }}>
                  {totalFailed.toLocaleString()}
                </span>
              </div>
              <div style={kpiCard("총 레코드", totalRecords, T.blue)}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  총 레코드 수
                </span>
                <span style={{ fontSize: 28, fontWeight: 900, color: T.blue }}>
                  {totalRecords.toLocaleString()}
                </span>
              </div>
            </div>

            {/* ── Section 2: Node Status Grid ── */}
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 14,
                color: T.text,
              }}
            >
              노드 상태
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 14,
                marginBottom: 32,
              }}
            >
              {nodes.length === 0 ? (
                <div
                  style={{
                    color: T.muted,
                    fontSize: 13,
                    padding: 20,
                    gridColumn: "1 / -1",
                  }}
                >
                  등록된 엣지 노드가 없습니다
                </div>
              ) : (
                nodes.map((node) => {
                  const healthRate =
                    node.total > 0
                      ? Math.round((node.completed / node.total) * 100)
                      : 0;
                  const isHealthy = node.failed === 0 || healthRate >= 80;

                  return (
                    <div
                      key={node.nodeId}
                      style={{
                        background: T.card,
                        border: `1px solid ${T.border}`,
                        borderRadius: 12,
                        padding: "18px 20px",
                      }}
                    >
                      {/* Node Header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: isHealthy ? "#10b981" : "#ef4444",
                            boxShadow: isHealthy
                              ? "0 0 8px rgba(16,185,129,0.5)"
                              : "0 0 8px rgba(239,68,68,0.5)",
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 13,
                            fontWeight: 700,
                            color: T.text,
                          }}
                        >
                          {node.nodeId}
                        </span>
                      </div>

                      {/* Stats */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 8,
                          marginBottom: 12,
                          fontSize: 11,
                        }}
                      >
                        <div>
                          <div style={{ color: T.muted }}>전체</div>
                          <div style={{ fontWeight: 700 }}>{node.total}</div>
                        </div>
                        <div>
                          <div style={{ color: T.muted }}>성공</div>
                          <div style={{ fontWeight: 700, color: T.green }}>
                            {node.completed}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: T.muted }}>실패</div>
                          <div style={{ fontWeight: 700, color: T.red }}>
                            {node.failed}
                          </div>
                        </div>
                      </div>

                      {/* Success Rate Bar */}
                      <div style={{ marginBottom: 8 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 10,
                            color: T.muted,
                            marginBottom: 4,
                          }}
                        >
                          <span>성공률</span>
                          <span>{healthRate}%</span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: 6,
                            background: T.surface,
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${healthRate}%`,
                              height: "100%",
                              background:
                                healthRate >= 80
                                  ? T.green
                                  : healthRate >= 50
                                    ? T.yellow
                                    : T.red,
                              borderRadius: 3,
                              transition: "width 0.3s",
                            }}
                          />
                        </div>
                      </div>

                      {/* Last Sync */}
                      <div style={{ fontSize: 10, color: T.muted }}>
                        마지막 동기화: {fmtDate(node.lastSync)}
                      </div>
                      <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                        레코드: {node.records.toLocaleString()}건
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Section 3: Sync History Table ── */}
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 14,
                color: T.text,
              }}
            >
              동기화 이력
            </h2>
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                overflow: "hidden",
                marginBottom: 32,
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.2fr 80px 1fr 80px 90px 1.2fr 1.2fr",
                  padding: "10px 16px",
                  borderBottom: `1px solid ${T.border}`,
                  fontSize: 11,
                  color: T.muted,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  gap: 8,
                }}
              >
                <span>노드 ID</span>
                <span>방향</span>
                <span>테이블명</span>
                <span>레코드</span>
                <span>상태</span>
                <span>시작 시간</span>
                <span>완료 시간</span>
              </div>

              {logs.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: T.muted,
                    fontSize: 13,
                  }}
                >
                  동기화 이력이 없습니다
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1.2fr 80px 1fr 80px 90px 1.2fr 1.2fr",
                      padding: "10px 16px",
                      borderBottom: `1px solid ${T.border}`,
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: T.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {log.edge_node_id}
                    </div>
                    <div>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#fff",
                          background:
                            log.sync_direction === "push"
                              ? T.blue
                              : T.accent,
                        }}
                      >
                        {log.sync_direction}
                      </span>
                    </div>
                    <div
                      style={{
                        color: T.textMuted,
                        fontSize: 11,
                        fontFamily: "monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {log.table_name}
                    </div>
                    <div style={{ fontSize: 11, color: T.text }}>
                      {log.records_synced != null
                        ? log.records_synced.toLocaleString()
                        : "--"}
                    </div>
                    <div>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#fff",
                          background:
                            STATUS_COLORS[log.status] ?? T.muted,
                        }}
                      >
                        {log.status}
                      </span>
                    </div>
                    <div style={{ color: T.muted, fontSize: 11 }}>
                      {fmtDate(log.started_at)}
                    </div>
                    <div style={{ color: T.muted, fontSize: 11 }}>
                      {fmtDate(log.completed_at)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Section 4: Manual Sync Trigger ── */}
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 14,
                color: T.text,
              }}
            >
              수동 동기화 트리거
            </h2>
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: "24px 24px 20px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 14,
                  marginBottom: 18,
                }}
              >
                {/* Node ID */}
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    노드 ID
                  </label>
                  <input
                    value={formNodeId}
                    onChange={(e) => setFormNodeId(e.target.value)}
                    placeholder="엣지 노드 ID"
                    style={inputStyle}
                  />
                </div>

                {/* Table Name */}
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    테이블명
                  </label>
                  <input
                    value={formTable}
                    onChange={(e) => setFormTable(e.target.value)}
                    placeholder="동기화할 테이블명"
                    style={inputStyle}
                  />
                </div>

                {/* Direction */}
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    방향
                  </label>
                  <select
                    value={formDirection}
                    onChange={(e) =>
                      setFormDirection(e.target.value as "push" | "pull")
                    }
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                      appearance: "auto" as React.CSSProperties["appearance"],
                    }}
                  >
                    <option value="push">Push (클라우드 → 엣지)</option>
                    <option value="pull">Pull (엣지 → 클라우드)</option>
                  </select>
                </div>
              </div>

              {/* Submit */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={handleSync}
                  disabled={submitting}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: T.gradient,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {submitting ? "요청 중..." : "동기화 시작"}
                </button>
                {formMsg && (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: formMsg.includes("시작됨") ? T.green : T.red,
                    }}
                  >
                    {formMsg}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
