"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import useSWR from "swr";
import AppShell from "@/components/AppShell";
import { T } from "@/lib/theme";

/* ── 타입 ── */
type Summary = { totalRequests: number; totalTokens: number; totalCost: number };
type ToolRow = { tool: string; count: number; tokens: number; cost: number };
type DeptRow = { department: string; count: number; tokens: number; cost: number };
type TypeRow = { type: string; count: number };
type HubData = {
  summary: Summary;
  byTool: ToolRow[];
  byDepartment: DeptRow[];
  byType: TypeRow[];
  range: string;
};

/* ── 바 차트 색상 ── */
const TOOL_COLORS: Record<string, string> = {
  "GPT-4o": "#10b981",
  Claude: "#f97316",
  Gemini: "#3b82f6",
  Grok: "#ef4444",
};
const fallbackColor = "#8b5cf6";

/* ── 요청 유형 라벨 ── */
const TYPE_LABELS: Record<string, string> = {
  chat: "채팅",
  code_gen: "코드 생성",
  review: "리뷰",
  translate: "번역",
};

const TYPE_COLORS: Record<string, string> = {
  chat: "#3b82f6",
  code_gen: "#10b981",
  review: "#f97316",
  translate: "#8b5cf6",
};

/* ── Fetcher ── */
const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r)));

/* ── 숫자 포맷 ── */
function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function AdminAiHubPage() {
  const [range, setRange] = useState<"24h" | "7d" | "30d">("7d");
  const { data, error, isLoading } = useSWR<HubData>(
    `/api/admin/ai-hub?range=${range}`,
    fetcher,
  );

  const summary = data?.summary ?? { totalRequests: 0, totalTokens: 0, totalCost: 0 };
  const byTool = data?.byTool ?? [];
  const byDept = data?.byDepartment ?? [];
  const byType = data?.byType ?? [];
  const maxToolTokens = Math.max(...byTool.map((t) => t.tokens), 1);
  const totalTypeCount = byType.reduce((s, t) => s + t.count, 0) || 1;

  const ranges: { key: "24h" | "7d" | "30d"; label: string }[] = [
    { key: "24h", label: "24시간" },
    { key: "7d", label: "7일" },
    { key: "30d", label: "30일" },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
        {/* ── 헤더 ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, marginBottom: 4 }}>
              AI Data Hub
            </h1>
            <p style={{ color: T.textMuted, fontSize: 14 }}>
              AI 도구 사용량 분석 대시보드
            </p>
          </div>

          {/* 기간 필터 */}
          <div style={{ display: "flex", gap: 6 }}>
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: `1px solid ${range === r.key ? T.accent : T.border}`,
                  background: range === r.key ? `${T.accent}22` : T.card,
                  color: range === r.key ? T.accent : T.textMuted,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 로딩 / 에러 ── */}
        {isLoading && (
          <p style={{ color: T.textMuted, fontSize: 14, textAlign: "center", padding: 40 }}>
            데이터 불러오는 중...
          </p>
        )}
        {error && (
          <p style={{ color: T.red, fontSize: 14, textAlign: "center", padding: 40 }}>
            데이터를 불러올 수 없습니다.
          </p>
        )}

        {!isLoading && !error && (
          <>
            {/* ── KPI 카드 3개 ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 14,
                marginBottom: 32,
              }}
            >
              {[
                { label: "총 요청 수", value: fmtNum(summary.totalRequests), color: T.blue },
                { label: "총 토큰", value: fmtNum(summary.totalTokens), color: T.green },
                {
                  label: "총 비용 (USD)",
                  value: `$${summary.totalCost.toFixed(2)}`,
                  color: T.accent,
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    background: T.card,
                    borderRadius: 12,
                    padding: "22px 20px",
                    border: `1px solid ${T.border}`,
                  }}
                >
                  <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>{kpi.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: kpi.color }}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* ── 도구별 사용량 바 차트 ── */}
            <div
              style={{
                background: T.card,
                borderRadius: 12,
                padding: "22px 20px",
                marginBottom: 24,
                border: `1px solid ${T.border}`,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 18 }}>
                도구별 사용량
              </h2>

              {byTool.length === 0 && (
                <p style={{ color: T.textMuted, fontSize: 13 }}>데이터 없음</p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {byTool.map((t) => {
                  const pct = (t.tokens / maxToolTokens) * 100;
                  const color = TOOL_COLORS[t.tool] ?? fallbackColor;
                  return (
                    <div key={t.tool}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                          {t.tool}
                        </span>
                        <span style={{ fontSize: 12, color: T.textMuted }}>
                          {fmtNum(t.tokens)} tokens / {t.count}건 / ${t.cost.toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: 22,
                          borderRadius: 6,
                          background: T.surface,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(pct, 2)}%`,
                            height: "100%",
                            borderRadius: 6,
                            background: `linear-gradient(90deg, ${color} 0%, ${color}aa 100%)`,
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 부서별 사용량 테이블 ── */}
            <div
              style={{
                background: T.card,
                borderRadius: 12,
                padding: "22px 20px",
                marginBottom: 24,
                border: `1px solid ${T.border}`,
                overflowX: "auto",
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16 }}>
                부서별 사용량
              </h2>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  color: T.text,
                }}
              >
                <thead>
                  <tr>
                    {["부서", "요청 수", "토큰", "비용 (USD)"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          borderBottom: `1px solid ${T.border}`,
                          color: T.textMuted,
                          fontWeight: 600,
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byDept.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{ padding: 20, textAlign: "center", color: T.textMuted }}
                      >
                        데이터 없음
                      </td>
                    </tr>
                  )}
                  {byDept.map((d) => (
                    <tr key={d.department} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{d.department}</td>
                      <td style={{ padding: "10px 12px" }}>{d.count.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px" }}>{fmtNum(d.tokens)}</td>
                      <td style={{ padding: "10px 12px", color: T.accent }}>
                        ${d.cost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── 요청 유형 분포 ── */}
            <div
              style={{
                background: T.card,
                borderRadius: 12,
                padding: "22px 20px",
                border: `1px solid ${T.border}`,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16 }}>
                요청 유형 분포
              </h2>

              {byType.length === 0 && (
                <p style={{ color: T.textMuted, fontSize: 13 }}>데이터 없음</p>
              )}

              {byType.length > 0 && (
                <>
                  {/* 가로 비율 바 */}
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      height: 32,
                      borderRadius: 8,
                      overflow: "hidden",
                      marginBottom: 14,
                    }}
                  >
                    {byType.map((t) => {
                      const pct = (t.count / totalTypeCount) * 100;
                      const color = TYPE_COLORS[t.type] ?? fallbackColor;
                      return (
                        <div
                          key={t.type}
                          title={`${TYPE_LABELS[t.type] ?? t.type}: ${t.count}건 (${pct.toFixed(1)}%)`}
                          style={{
                            width: `${pct}%`,
                            minWidth: pct > 0 ? 4 : 0,
                            height: "100%",
                            background: color,
                            transition: "width 0.4s ease",
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* 범례 */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                    {byType.map((t) => {
                      const color = TYPE_COLORS[t.type] ?? fallbackColor;
                      const pct = ((t.count / totalTypeCount) * 100).toFixed(1);
                      return (
                        <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              display: "inline-block",
                              width: 10,
                              height: 10,
                              borderRadius: 3,
                              background: color,
                            }}
                          />
                          <span style={{ fontSize: 12, color: T.textMuted }}>
                            {TYPE_LABELS[t.type] ?? t.type}{" "}
                            <span style={{ fontWeight: 700, color: T.text }}>
                              {t.count}건
                            </span>{" "}
                            ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
