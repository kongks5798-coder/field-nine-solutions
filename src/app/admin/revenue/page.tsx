"use client";

import { useEffect, useState } from "react";

// ─── Tesla warm ivory palette ───────────────────────────────────────────────
const W = {
  bg:     "#faf8f5",
  card:   "#ffffff",
  border: "#e8e4dc",
  text:   "#0a0a0a",
  muted:  "#6b6b6b",
  sub:    "#9a9a9a",
  accent: "#0a0a0a",   // black bars
  green:  "#1a7a3f",
  red:    "#b91c1c",
  orange: "#c2410c",
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────
interface RevenueData {
  users: { total: number; pro: number; team: number; free: number };
  revenue: { thisMonth: number; lastMonth: number; outstanding: number; failedCount: number };
  recentEvents: { type: string; amount: number; description: string; created_at: string }[];
}

interface MetricsData {
  mrr: number;
  newPayers30d: number;
  churnRate: number;
  arpu: number;
  dau: number;
  mau: number;
  topApps: Array<{ slug: string; views: number; name: string }>;
  generationSuccessRate: number;
}

// ─── Daily revenue bar data ───────────────────────────────────────────────────
interface DailyBar {
  label: string;
  amount: number;
}

function buildDailyBars(events: RevenueData["recentEvents"]): DailyBar[] {
  const map: Record<string, number> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    map[d.toISOString().slice(0, 10)] = 0;
  }
  for (const ev of events) {
    if (ev.amount > 0) {
      const day = ev.created_at.slice(0, 10);
      if (day in map) map[day] += ev.amount;
    }
  }
  return Object.entries(map).map(([date, amount]) => ({
    label: date.slice(5), // "MM-DD"
    amount,
  }));
}

// ─── SVG Bar Chart ─────────────────────────────────────────────────────────
function RevenueBarChart({ bars }: { bars: DailyBar[] }) {
  const W_SVG = 560;
  const H_SVG = 120;
  const PAD = { top: 10, right: 16, bottom: 28, left: 56 };
  const chartW = W_SVG - PAD.left - PAD.right;
  const chartH = H_SVG - PAD.top - PAD.bottom;
  const maxVal = Math.max(...bars.map((b) => b.amount), 1);
  const barGap = 6;
  const barW = Math.floor((chartW - barGap * (bars.length - 1)) / bars.length);

  // Y-axis ticks
  const yTicks = [0, 0.5, 1].map((f) => Math.round(maxVal * f));

  return (
    <svg
      viewBox={`0 0 ${W_SVG} ${H_SVG}`}
      style={{ width: "100%", height: H_SVG, display: "block" }}
      aria-label="최근 7일 일별 수익"
    >
      {/* Y gridlines */}
      {yTicks.map((tick, i) => {
        const y = PAD.top + chartH - (tick / maxVal) * chartH;
        return (
          <g key={i}>
            <line
              x1={PAD.left} x2={PAD.left + chartW}
              y1={y} y2={y}
              stroke="#e8e4dc" strokeWidth={1}
            />
            <text
              x={PAD.left - 6} y={y + 4}
              textAnchor="end"
              fontSize={9}
              fill="#9a9a9a"
            >
              {tick >= 10000
                ? `${Math.round(tick / 1000)}k`
                : tick.toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {bars.map((bar, i) => {
        const x = PAD.left + i * (barW + barGap);
        const barH = Math.max((bar.amount / maxVal) * chartH, bar.amount > 0 ? 2 : 0);
        const y = PAD.top + chartH - barH;
        return (
          <g key={bar.label}>
            <rect
              x={x} y={y}
              width={barW} height={barH}
              fill="#0a0a0a"
              rx={2}
            >
              <title>{bar.label}: {bar.amount.toLocaleString()}원</title>
            </rect>
            <text
              x={x + barW / 2}
              y={H_SVG - PAD.bottom + 14}
              textAnchor="middle"
              fontSize={9}
              fill="#9a9a9a"
            >
              {bar.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: W.card,
        border: `1px solid ${W.border}`,
        borderRadius: 12,
        padding: "20px 22px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: W.sub,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: highlight ? W.orange : W.text,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: W.muted, marginTop: 5 }}>{sub}</div>
    </div>
  );
}

const EVENT_LABEL: Record<string, string> = {
  subscription_created:  "구독 시작",
  payment_succeeded:     "결제 성공",
  payment_failed:        "결제 실패",
  subscription_canceled: "구독 취소",
  usage_invoiced:        "사용료 청구",
  usage_invoice_failed:  "사용료 실패",
};

// ─── Page ──────────────────────────────────────────────────────────────────
export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (s: string) => {
    setLoading(true);
    setErr("");
    try {
      const [rRev, rMet] = await Promise.allSettled([
        fetch("/api/admin/revenue", { headers: { "x-admin-secret": s } }),
        fetch("/api/admin/metrics"),
      ]);

      if (rRev.status === "fulfilled" && rRev.value.ok) {
        setData(await rRev.value.json());
        setAuthed(true);
      } else {
        setErr("인증 실패 — ADMIN_SECRET을 확인하세요");
        setLoading(false);
        return;
      }

      if (rMet.status === "fulfilled" && rMet.value.ok) {
        setMetrics(await rMet.value.json());
      }
    } catch {
      setErr("네트워크 오류");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // auto-reload if already authenticated (page revisit)
  }, []);

  // ─── Auth gate ─────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: W.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: '"Inter", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            background: W.card,
            border: `1px solid ${W.border}`,
            borderRadius: 16,
            padding: "36px 44px",
            width: 380,
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: W.muted,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Dalkak Admin
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: W.text,
              margin: "0 0 24px",
            }}
          >
            수익 대시보드
          </h2>
          <input
            type="password"
            placeholder="ADMIN_SECRET"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(secret)}
            style={{
              width: "100%",
              padding: "11px 14px",
              background: W.bg,
              border: `1px solid ${W.border}`,
              borderRadius: 8,
              color: W.text,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
          {err && (
            <p style={{ color: W.red, fontSize: 12, marginTop: 8 }}>{err}</p>
          )}
          <button
            onClick={() => load(secret)}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "11px",
              background: W.text,
              color: W.bg,
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.02em",
            }}
          >
            {loading ? "인증 중..." : "로그인"}
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: W.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: W.muted,
          fontFamily: '"Inter", system-ui, sans-serif',
        }}
      >
        로딩 중...
      </div>
    );
  }

  const growth =
    data.revenue.lastMonth > 0
      ? Math.round(
          ((data.revenue.thisMonth - data.revenue.lastMonth) /
            data.revenue.lastMonth) *
            100
        )
      : 0;

  const dailyBars = buildDailyBars(data.recentEvents);

  // ─── Derived MRR metrics ──────────────────────────────────────────────
  const mrr = metrics?.mrr ?? (data.users.pro + data.users.team) * 39000;
  const newPayers30d = metrics?.newPayers30d ?? 0;
  const churnPct =
    metrics != null
      ? (metrics.churnRate * 100).toFixed(1) + "%"
      : "—";
  const arpu =
    metrics?.arpu != null
      ? metrics.arpu.toLocaleString() + "원"
      : "—";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: W.bg,
        color: W.text,
        fontFamily: '"Inter", system-ui, sans-serif',
        padding: "36px 28px",
        maxWidth: 1080,
        margin: "0 auto",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: W.sub,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Dalkak · Admin
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            수익 대시보드
          </h1>
        </div>
        <button
          onClick={() => load(secret)}
          disabled={loading}
          style={{
            padding: "8px 18px",
            background: "transparent",
            border: `1px solid ${W.border}`,
            borderRadius: 8,
            color: W.muted,
            fontSize: 12,
            cursor: loading ? "wait" : "pointer",
            fontFamily: "inherit",
            fontWeight: 600,
          }}
        >
          {loading ? "새로고침 중..." : "새로고침"}
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <MetricCard
          label="MRR"
          value={`₩${mrr.toLocaleString()}`}
          sub={`Pro ${data.users.pro} + Team ${data.users.team} 명`}
          highlight
        />
        <MetricCard
          label="신규 결제 (30일)"
          value={newPayers30d.toLocaleString() + "명"}
          sub="최근 30일 첫 결제"
        />
        <MetricCard
          label="Churn Rate"
          value={churnPct}
          sub="취소 / 전체 유료"
        />
        <MetricCard
          label="ARPU"
          value={arpu}
          sub="유료 유저 평균 수익"
        />
      </div>

      {/* ── Revenue Bar Chart ── */}
      <div
        style={{
          background: W.card,
          border: `1px solid ${W.border}`,
          borderRadius: 14,
          padding: "22px 24px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700 }}>최근 7일 일별 수익</div>
          <div style={{ fontSize: 11, color: W.sub }}>
            이번달 누적:{" "}
            <strong style={{ color: W.text }}>
              {data.revenue.thisMonth.toLocaleString()}원
            </strong>
            {growth !== 0 && (
              <span
                style={{
                  marginLeft: 8,
                  color: growth > 0 ? W.green : W.red,
                }}
              >
                {growth > 0 ? "+" : ""}
                {growth}% vs 전월
              </span>
            )}
          </div>
        </div>
        <RevenueBarChart bars={dailyBars} />
      </div>

      {/* ── Plan distribution + recent events ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Plan Distribution */}
        <div
          style={{
            background: W.card,
            border: `1px solid ${W.border}`,
            borderRadius: 14,
            padding: "22px 24px",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
            플랜 분포
          </div>
          {[
            { label: "스타터 (무료)", count: data.users.free, note: "" },
            { label: "Pro", count: data.users.pro, note: "₩39,000/월" },
            { label: "Team", count: data.users.team, note: "₩39,000/월" },
          ].map((p) => (
            <div
              key={p.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "9px 0",
                borderBottom: `1px solid ${W.border}`,
                fontSize: 13,
              }}
            >
              <span style={{ color: W.text }}>{p.label}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {p.note && (
                  <span style={{ fontSize: 11, color: W.sub }}>{p.note}</span>
                )}
                <strong>{p.count.toLocaleString()}명</strong>
              </span>
            </div>
          ))}
          <div style={{ marginTop: 14, fontSize: 12, color: W.muted }}>
            유료 전환율{" "}
            <strong style={{ color: W.text }}>
              {data.users.total > 0
                ? Math.round(
                    ((data.users.pro + data.users.team) / data.users.total) * 100
                  )
                : 0}
              %
            </strong>
            &nbsp;·&nbsp; 전체{" "}
            <strong style={{ color: W.text }}>
              {data.users.total.toLocaleString()}명
            </strong>
          </div>
        </div>

        {/* Recent billing events */}
        <div
          style={{
            background: W.card,
            border: `1px solid ${W.border}`,
            borderRadius: 14,
            padding: "22px 24px",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
            최근 결제 이벤트
          </div>
          {data.recentEvents.length === 0 ? (
            <p style={{ color: W.muted, fontSize: 13 }}>이벤트 없음</p>
          ) : (
            data.recentEvents.slice(0, 8).map((ev, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "7px 0",
                  borderBottom: `1px solid ${W.border}`,
                  fontSize: 12,
                }}
              >
                <div>
                  <span
                    style={{
                      color: ev.type.includes("fail") || ev.type.includes("cancel")
                        ? W.red
                        : W.green,
                      fontWeight: 600,
                    }}
                  >
                    {EVENT_LABEL[ev.type] ?? ev.type}
                  </span>
                  <span style={{ color: W.sub, marginLeft: 8 }}>
                    {new Date(ev.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                {ev.amount > 0 && (
                  <span style={{ fontWeight: 700, color: W.text }}>
                    {ev.amount.toLocaleString()}원
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Outstanding ── */}
      {data.revenue.outstanding > 0 && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13,
          }}
        >
          <span style={{ color: W.red, fontWeight: 600 }}>
            미수금 — {data.revenue.failedCount}건 결제 실패
          </span>
          <span style={{ fontWeight: 800, color: W.red, fontSize: 16 }}>
            {data.revenue.outstanding.toLocaleString()}원
          </span>
        </div>
      )}
    </div>
  );
}
