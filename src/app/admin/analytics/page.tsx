"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { T } from "@/lib/theme";

type AnalyticsData = {
  dau: number;
  mau: number;
  totalApps: number;
  appsThisWeek: number;
  topTemplates: Array<{ name: string; count: number }>;
  aiModelUsage: Array<{ model: string; count: number }>;
  dailySignups: Array<{ date: string; count: number }>;
  dailyApps: Array<{ date: string; count: number }>;
};

function KpiCard({
  title,
  value,
  sub,
  color,
}: {
  title: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: T.muted,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: color ?? T.text,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

function BarChart({
  data,
  color,
}: {
  data: Array<{ date: string; count: number }>;
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 4,
        height: 80,
        padding: "0 2px",
      }}
    >
      {data.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.count}`}
          style={{
            flex: 1,
            background: color,
            height: `${Math.max((d.count / max) * 100, d.count > 0 ? 4 : 0)}%`,
            minHeight: d.count > 0 ? 2 : 0,
            borderRadius: "3px 3px 0 0",
            opacity: 0.85,
            transition: "height 0.3s",
          }}
        />
      ))}
    </div>
  );
}

function ChartCard({
  title,
  data,
  color,
  sub,
}: {
  title: string;
  data: Array<{ date: string; count: number }>;
  color: string;
  sub?: string;
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const first = data[0]?.date?.slice(5) ?? "";
  const last = data[data.length - 1]?.date?.slice(5) ?? "";

  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: "20px 24px",
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
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: T.muted }}>
          {sub ?? `합계 ${total}`}
        </div>
      </div>
      <BarChart data={data} color={color} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          fontSize: 10,
          color: T.muted,
        }}
      >
        <span>{first}</span>
        <span>{last}</span>
      </div>
    </div>
  );
}

function TopTemplatesList({
  items,
}: {
  items: Array<{ name: string; count: number }>;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: "20px 24px",
      }}
    >
      <div
        style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}
      >
        인기 템플릿 TOP 5
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 13, color: T.muted, textAlign: "center", padding: 20 }}>
          데이터 없음
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item, idx) => {
            const pct = Math.round((item.count / max) * 100);
            return (
              <div key={item.name}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: idx === 0 ? T.accent : T.muted,
                        width: 16,
                        textAlign: "center",
                      }}
                    >
                      {idx + 1}
                    </span>
                    {item.name}
                  </span>
                  <span style={{ color: T.muted }}>{item.count}회</span>
                </div>
                <div
                  style={{
                    height: 5,
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      height: 5,
                      borderRadius: 4,
                      background: idx === 0 ? T.accent : T.blue,
                      width: `${pct}%`,
                      transition: "width 0.4s",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AiModelChart({
  items,
}: {
  items: Array<{ model: string; count: number }>;
}) {
  const total = items.reduce((s, i) => s + i.count, 0);
  const colors = [T.accent, T.blue, T.green, T.yellow, T.accentPink];

  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: "20px 24px",
      }}
    >
      <div
        style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}
      >
        AI 모델별 사용량
      </div>
      {items.length === 0 ? (
        <div
          style={{ fontSize: 13, color: T.muted, textAlign: "center", padding: 20 }}
        >
          데이터 없음
        </div>
      ) : (
        <>
          {/* Stacked bar */}
          <div
            style={{
              display: "flex",
              height: 16,
              borderRadius: 8,
              overflow: "hidden",
              marginBottom: 16,
              gap: 2,
            }}
          >
            {items.map((item, idx) => {
              const pct = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <div
                  key={item.model}
                  title={`${item.model}: ${item.count} (${pct.toFixed(1)}%)`}
                  style={{
                    width: `${pct}%`,
                    background: colors[idx % colors.length],
                    minWidth: pct > 0 ? 4 : 0,
                    borderRadius: 4,
                  }}
                />
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((item, idx) => {
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div
                  key={item.model}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: colors[idx % colors.length],
                        flexShrink: 0,
                        display: "inline-block",
                      }}
                    />
                    <span style={{ color: T.text }}>{item.model}</span>
                  </div>
                  <span style={{ color: T.muted }}>
                    {item.count.toLocaleString()} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/analytics");
      if (!r.ok) {
        setError(`데이터 로드 실패 (${r.status})`);
        return;
      }
      setData(await r.json());
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div
      style={{
        padding: "28px 32px",
        color: T.text,
        fontFamily: T.fontStack,
        maxWidth: 1200,
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
          <h1
            style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}
          >
            애널리틱스
          </h1>
          <p style={{ fontSize: 13, color: T.muted, margin: "4px 0 0" }}>
            DAU · MAU · 앱 배포 · 템플릿 · AI 모델 사용 현황
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            background: "rgba(249,115,22,0.1)",
            border: "1px solid rgba(249,115,22,0.3)",
            borderRadius: 8,
            padding: "7px 16px",
            fontSize: 13,
            color: T.accent,
            cursor: loading ? "wait" : "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "로딩 중..." : "새로고침"}
        </button>
      </div>

      {loading ? (
        <div
          style={{
            color: T.muted,
            fontSize: 14,
            textAlign: "center",
            padding: 60,
          }}
        >
          로딩 중...
        </div>
      ) : error ? (
        <div style={{ color: T.red, fontSize: 14, padding: 20 }}>{error}</div>
      ) : data ? (
        <>
          {/* KPI 카드 4종 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <KpiCard
              title="DAU (일간 활성 유저)"
              value={data.dau.toLocaleString()}
              sub="오늘 활성"
              color={T.accent}
            />
            <KpiCard
              title="MAU (월간 활성 유저)"
              value={data.mau.toLocaleString()}
              sub="이번달 활성"
              color={T.blue}
            />
            <KpiCard
              title="배포된 앱"
              value={data.totalApps.toLocaleString()}
              sub="전체 누적"
              color={T.green}
            />
            <KpiCard
              title="이번주 신규 앱"
              value={data.appsThisWeek.toLocaleString()}
              sub="최근 7일"
              color={T.yellow}
            />
          </div>

          {/* 일별 차트 2열 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <ChartCard
              title="일별 신규 가입 (14일)"
              data={data.dailySignups}
              color={T.accent}
            />
            <ChartCard
              title="일별 앱 배포 (14일)"
              data={data.dailyApps}
              color={T.blue}
            />
          </div>

          {/* 템플릿 + AI 모델 2열 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            <TopTemplatesList items={data.topTemplates} />
            <AiModelChart items={data.aiModelUsage} />
          </div>
        </>
      ) : null}
    </div>
  );
}
