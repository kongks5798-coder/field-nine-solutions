"use client";
export const dynamic = "force-dynamic";

import { BarChart } from "@/components/Chart";
import { useEffect, useState } from "react";
import type { AIAnalysis } from "@/core/jarvis";
import type { ProactiveReport } from "@/core/proactive";

type Point = { t: string; v: number };
type LocalSummary = {
  salesSummary: { delta: number; growthRate: number };
  trendSummary: { delta: number; growthRate: number };
};
type IntegrationsStatus = {
  ok: boolean;
  platform: { vercel: boolean; cloudflare: boolean };
  auth: { admin: boolean; secret: boolean; ok: boolean };
  ai: { openai: boolean; openaiBase: boolean; openrouter: boolean; openrouterBase: boolean; ok: boolean };
  slack: { webhook: boolean; bot: boolean; channel: boolean; ok: boolean };
  linear: { key: boolean; team: boolean; ok: boolean };
  zapier: { url: boolean; ok: boolean };
  supabase: { enabled: boolean; url: boolean; key: boolean; tables: boolean; ok: boolean };
};

export default function AdminPage() {
  const [sales, setSales] = useState<Point[]>([]);
  const [trends, setTrends] = useState<Point[]>([]);
  const [analysis, setAnalysis] = useState<{ local: LocalSummary; ai: AIAnalysis | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ customers: number; orders: number; revenue: number } | null>(null);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [orders, setOrders] = useState<Array<{ id: string; customerId: string; amount: number; status: string }>>([]);
  const [proactive, setProactive] = useState<ProactiveReport | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationsStatus | null>(null);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [envCopied, setEnvCopied] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [integrationsUpdatedAt, setIntegrationsUpdatedAt] = useState<string | null>(null);

  const parseFile = async (file: File) => {
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) {
        return json as Point[];
      }
      return [];
    } catch {
      const lines = text.trim().split(/\r?\n/);
      const arr: Point[] = [];
      for (const line of lines) {
        const [t, v] = line.split(",").map((s) => s.trim());
        const num = Number(v);
        if (t && !Number.isNaN(num)) arr.push({ t, v: num });
      }
      return arr;
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    const resp = await fetch("/api/admin/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sales, trends }),
    });
    const data = await resp.json();
    setAnalysis(data.result);
    setLoading(false);
  };

  const loadIntegrations = async () => {
    setIntegrationsLoading(true);
    const resp = await fetch("/api/system/integrations/status");
    const data = await resp.json().catch(() => null);
    setIntegrations(data);
    setIntegrationsUpdatedAt(new Date().toLocaleString());
    setIntegrationsLoading(false);
  };

  const statusPill = (ok: boolean, label: string) => (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${
        ok
          ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
          : "border-amber-500/40 text-amber-700 dark:text-amber-400"
      }`}
    >
      {label}
    </span>
  );

  const missing = integrations
    ? [
        { ok: integrations.auth.admin, label: "ADMIN_PASSWORD" },
        { ok: integrations.auth.secret, label: "JWT_SECRET or SESSION_SECRET" },
        {
          ok: integrations.ai.ok,
          label: "AI_INTEGRATIONS_OPENAI_API_KEY or AI_INTEGRATIONS_OPENROUTER_API_KEY",
        },
        { ok: integrations.slack.ok, label: "SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN + SLACK_CHANNEL_ID" },
        { ok: integrations.linear.ok, label: "LINEAR_API_KEY + LINEAR_TEAM_ID" },
        { ok: integrations.zapier.ok, label: "ZAPIER_WEBHOOK_URL" },
        ...(integrations.supabase.enabled
          ? [
              { ok: integrations.supabase.url, label: "SUPABASE_URL" },
              { ok: integrations.supabase.key, label: "SUPABASE_SERVICE_KEY" },
              { ok: integrations.supabase.tables, label: "Supabase tables (orders/customers)" },
            ]
          : []),
      ]
        .filter((x) => !x.ok)
        .map((x) => x.label)
    : [];

  const deployChecklist = [
    "GitHub 리포지토리 연결",
    "Vercel 프로젝트 생성 및 환경변수 주입",
    "Supabase 테이블 생성 후 DB_PROVIDER=supabase 설정",
    "fieldnine.io 도메인 연결",
    "Cloudflare 프록시/DNS 설정",
  ];

  const envChecklist = [
    "ADMIN_PASSWORD",
    "JWT_SECRET 또는 SESSION_SECRET",
    "AI_INTEGRATIONS_OPENAI_API_KEY 또는 AI_INTEGRATIONS_OPENROUTER_API_KEY",
    "SLACK_WEBHOOK_URL 또는 SLACK_BOT_TOKEN + SLACK_CHANNEL_ID",
    "LINEAR_API_KEY + LINEAR_TEAM_ID",
    "ZAPIER_WEBHOOK_URL",
    "SUPABASE_URL + SUPABASE_SERVICE_KEY (DB_PROVIDER=supabase 사용 시)",
  ];

  const envTemplate = [
    "ADMIN_PASSWORD=",
    "JWT_SECRET=",
    "SESSION_SECRET=",
    "AI_INTEGRATIONS_OPENAI_API_KEY=",
    "AI_INTEGRATIONS_OPENAI_BASE_URL=",
    "AI_INTEGRATIONS_OPENROUTER_API_KEY=",
    "AI_INTEGRATIONS_OPENROUTER_BASE_URL=",
    "SLACK_WEBHOOK_URL=",
    "SLACK_BOT_TOKEN=",
    "SLACK_CHANNEL_ID=",
    "LINEAR_API_KEY=",
    "LINEAR_TEAM_ID=",
    "ZAPIER_WEBHOOK_URL=",
    "DB_PROVIDER=memory",
    "SUPABASE_URL=",
    "SUPABASE_SERVICE_KEY=",
  ].join("\n");

  const supabaseSchema = [
    "-- Enable UUID generation",
    "create extension if not exists \"pgcrypto\";",
    "",
    "-- Customers table",
    "create table if not exists public.customers (",
    "  id uuid primary key default gen_random_uuid(),",
    "  name text not null,",
    "  email text not null,",
    "  created_at timestamptz not null default now()",
    ");",
    "",
    "-- Unique email optional (comment out if not desired)",
    "create unique index if not exists customers_email_unique on public.customers (lower(email));",
    "",
    "-- Orders table",
    "create table if not exists public.orders (",
    "  id uuid primary key default gen_random_uuid(),",
    "  customer_id uuid not null references public.customers(id) on delete cascade,",
    "  amount numeric(12,2) not null check (amount > 0),",
    "  status text not null check (status in ('pending','paid','cancelled','refunded')),",
    "  created_at timestamptz not null default now()",
    ");",
    "",
    "-- Indexes for query performance",
    "create index if not exists customers_created_at_desc on public.customers (created_at desc);",
    "create index if not exists orders_created_at_desc on public.orders (created_at desc);",
    "create index if not exists orders_customer_id_idx on public.orders (customer_id);",
    "",
    "-- PostgREST hints (optional): expose tables via REST",
    "-- Supabase exposes public schema via Rest by default; nothing else required.",
    "",
    "-- Test selects",
    "-- select * from public.customers limit 1;",
    "-- select * from public.orders limit 1;",
  ].join("\n");

  const copyEnvTemplate = async () => {
    await navigator.clipboard.writeText(envTemplate);
    setEnvCopied(true);
    setTimeout(() => setEnvCopied(false), 1500);
  };

  const copySupabaseSchema = async () => {
    await navigator.clipboard.writeText(supabaseSchema);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 1500);
  };

  useEffect(() => {
    const load = async () => {
      const resp = await fetch("/api/admin/stats");
      const data = await resp.json();
      setStats(data?.stats || null);
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const first = setTimeout(() => {
      void loadIntegrations();
    }, 0);
    const id = setInterval(() => {
      void loadIntegrations();
    }, 10000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="max-w-4xl w-full p-8 rounded-2xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-black/60 backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-sm opacity-80">fieldnine.io 운영 사령부</p>
        {stats ? (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border border-black/10 dark:border-white/15">
              <div className="text-xs opacity-60">Customers</div>
              <div className="text-2xl font-semibold">{stats.customers}</div>
            </div>
            <div className="p-4 rounded-lg border border-black/10 dark:border-white/15">
              <div className="text-xs opacity-60">Orders</div>
              <div className="text-2xl font-semibold">{stats.orders}</div>
            </div>
            <div className="p-4 rounded-lg border border-black/10 dark:border-white/15">
              <div className="text-xs opacity-60">Revenue</div>
              <div className="text-2xl font-semibold">${stats.revenue.toLocaleString()}</div>
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          <h2 className="text-xl font-semibold">인테그레이션 상태</h2>
          <div className="mt-3 flex items-center gap-3">
            <button
              className="inline-flex h-9 items-center justify-center rounded-full border border-black/10 dark:border-white/15 px-4 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={loadIntegrations}
              disabled={integrationsLoading}
            >
              {integrationsLoading ? "확인 중..." : "상태 새로고침"}
            </button>
            {integrations ? statusPill(integrations.ok, integrations.ok ? "전체 OK" : "필수 설정 필요") : null}
            {integrationsUpdatedAt ? <span className="text-xs opacity-70">{integrationsUpdatedAt}</span> : null}
          </div>
          {integrations ? (
            <>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-black/10 dark:border-white/15">
                  <h3 className="text-lg font-semibold">플랫폼</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {statusPill(integrations.platform.vercel, "Vercel")}
                    {statusPill(integrations.platform.cloudflare, "Cloudflare")}
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-black/10 dark:border-white/15">
                  <h3 className="text-lg font-semibold">인증</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {statusPill(integrations.auth.admin, "ADMIN_PASSWORD")}
                    {statusPill(integrations.auth.secret, "JWT/SESSION")}
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-black/10 dark:border-white/15">
                  <h3 className="text-lg font-semibold">AI</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {statusPill(integrations.ai.openai, "OpenAI Key")}
                    {statusPill(integrations.ai.openaiBase, "OpenAI Base")}
                    {statusPill(integrations.ai.openrouter, "OpenRouter Key")}
                    {statusPill(integrations.ai.openrouterBase, "OpenRouter Base")}
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-black/10 dark:border-white/15">
                  <h3 className="text-lg font-semibold">알림/연동</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {statusPill(integrations.slack.ok, "Slack")}
                    {statusPill(integrations.linear.ok, "Linear")}
                    {statusPill(integrations.zapier.ok, "Zapier")}
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-black/10 dark:border-white/15">
                  <h3 className="text-lg font-semibold">Supabase</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {statusPill(integrations.supabase.enabled, "Provider")}
                    {statusPill(integrations.supabase.url, "URL")}
                    {statusPill(integrations.supabase.key, "Service Key")}
                    {statusPill(integrations.supabase.tables, "Tables")}
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-xl border border-black/10 dark:border-white/15">
                <h3 className="text-lg font-semibold">누락 설정</h3>
                {missing.length > 0 ? (
                  <ul className="mt-2 text-sm opacity-80 list-disc pl-5">
                    {missing.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm opacity-80">모든 필수 설정 완료</p>
                )}
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-black/10 dark:border-white/15">
                  <h3 className="text-lg font-semibold">배포 체크리스트</h3>
                  <ul className="mt-2 text-sm opacity-80 list-disc pl-5">
                    {deployChecklist.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      className="inline-flex h-9 items-center justify-center rounded-full border border-black/10 dark:border-white/15 px-4 hover:bg-black/5 dark:hover:bg-white/10"
                      onClick={copySupabaseSchema}
                    >
                      Supabase 스키마 복사
                    </button>
                    {sqlCopied ? <span className="text-xs opacity-70">복사됨</span> : null}
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-black/10 dark:border-white/15">
                  <h3 className="text-lg font-semibold">환경변수 체크리스트</h3>
                  <ul className="mt-2 text-sm opacity-80 list-disc pl-5">
                    {envChecklist.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      className="inline-flex h-9 items-center justify-center rounded-full border border-black/10 dark:border-white/15 px-4 hover:bg-black/5 dark:hover:bg-white/10"
                      onClick={copyEnvTemplate}
                    >
                      env 템플릿 복사
                    </button>
                    {envCopied ? <span className="text-xs opacity-70">복사됨</span> : null}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium">매출 지표 업로드 (JSON/CSV)</label>
            <input
              type="file"
              className="mt-2 block w-full text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setSales(await parseFile(f));
              }}
            />
            {sales.length > 0 ? <BarChart data={sales} title="Sales" /> : null}
          </div>
          <div>
            <label className="text-sm font-medium">시장 트렌드 업로드 (JSON/CSV)</label>
            <input
              type="file"
              className="mt-2 block w-full text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setTrends(await parseFile(f));
              }}
            />
            {trends.length > 0 ? <BarChart data={trends} title="Trends" /> : null}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold">운영 관리 패널</h2>
          <div className="mt-4 flex gap-3">
            <button
              className="inline-flex h-9 items-center justify-center rounded-full border border-black/10 dark:border-white/15 px-4 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={async () => {
                const r = await fetch("/api/admin/customers");
                const d = await r.json();
                setCustomers(d.customers || []);
              }}
            >
              고객 불러오기
            </button>
            <button
              className="inline-flex h-9 items-center justify-center rounded-full border border-black/10 dark:border-white/15 px-4 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={async () => {
                const r = await fetch("/api/admin/orders");
                const d = await r.json();
                setOrders(d.orders || []);
              }}
            >
              주문 불러오기
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-black/10 dark:border-white/15">
              <h3 className="text-lg font-semibold">Customers</h3>
              <ul className="mt-2 text-sm opacity-80">
                {customers.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-1">
                    <span>{c.name} · {c.email}</span>
                    <button
                      className="text-xs rounded-full border px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10"
                      onClick={async () => {
                        await fetch(`/api/admin/customers/${c.id}`, { method: "DELETE" });
                        setCustomers(customers.filter((x) => x.id !== c.id));
                      }}
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-black/10 dark:border_WHITE/15">
              <h3 className="text-lg font-semibold">Orders</h3>
              <ul className="mt-2 text-sm opacity-80">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-1">
                    <span>#{o.id.slice(0, 6)} · ₩{o.amount} · {o.status}</span>
                    <div className="flex gap-2">
                      <button
                        className="text-xs rounded-full border px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10"
                        onClick={async () => {
                          await fetch(`/api/admin/orders/${o.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "cancelled" }),
                          });
                          setOrders(orders.map((x) => (x.id === o.id ? { ...x, status: "cancelled" } : x)));
                        }}
                        disabled={o.status !== "pending"}
                      >
                        취소
                      </button>
                      <button
                        className="text-xs rounded-full border px-3 py-1 hover:bg-black/5 dark:hover:bg_WHITE/10"
                        onClick={async () => {
                          await fetch(`/api/admin/orders/${o.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "refunded" }),
                          });
                          setOrders(orders.map((x) => (x.id === o.id ? { ...x, status: "refunded" } : x)));
                        }}
                        disabled={o.status !== "paid"}
                      >
                        환불
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-background hover:opacity-90 disabled:opacity-50"
            disabled={loading || sales.length === 0 || trends.length === 0}
            onClick={runAnalysis}
          >
            {loading ? "분석 중..." : "자비스 분석 실행"}
          </button>
          <button
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 dark:border-white/15 px-5 hover:bg-black/5 dark:hover:bg-white/10"
            onClick={async () => {
              const r = await fetch("/api/system/proactive");
              const d = await r.json();
              setProactive(d.report || null);
            }}
          >
            Proactive 리포트 실행
          </button>
        </div>

        {analysis ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-black/10 dark:border-white/15">
              <h3 className="text-lg font-semibold">Executive Summary</h3>
              <ul className="mt-2 text-sm opacity-80 list-disc pl-5">
                {(analysis.ai?.summary || []).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-black/10 dark:border-white/15">
              <h3 className="text-lg font-semibold">Recommended Actions</h3>
              <ul className="mt-2 text-sm opacity-80 list-disc pl-5">
                {(analysis.ai?.actions || []).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-black/10 dark:border-white/15">
              <h3 className="text-lg font-semibold">Key Risks</h3>
              <ul className="mt-2 text-sm opacity-80 list-disc pl-5">
                {(analysis.ai?.risks || []).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-black/10 dark:border-white/15">
              <h3 className="text-lg font-semibold">Forecast</h3>
              <p className="mt-2 text-sm opacity-80">{analysis.ai?.forecast || "N/A"}</p>
            </div>
          </div>
        ) : null}
        {proactive ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-black/10 dark:border-white/15">
              <h3 className="text-lg font-semibold">Proactive Signals</h3>
              <ul className="mt-2 text-sm opacity-80 list-disc pl-5">
                {proactive.signals.slice(0, 5).map((s, i) => (
                  <li key={i}>{s.message}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-black/10 dark:border-white/15">
              <h3 className="text-lg font-semibold">Forecast</h3>
              <p className="mt-2 text-sm opacity-80">
                다음 주 매출 ${proactive.forecast.nextRevenue.toLocaleString()} · 신뢰도 {(proactive.forecast.confidence * 100).toFixed(0)}%
              </p>
              <p className="mt-2 text-sm opacity-60">
                고객 {proactive.snapshot.customers} · 주문 {proactive.snapshot.orders} · 매출 ${proactive.snapshot.revenue.toLocaleString()}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
