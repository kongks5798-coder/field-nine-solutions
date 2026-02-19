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
  auth: { admin: boolean; secret: boolean; twoFactor: boolean; ok: boolean };
  ai: { openai: boolean; openaiBase: boolean; openrouter: boolean; openrouterBase: boolean; ok: boolean };
  slack: { webhook: boolean; bot: boolean; channel: boolean; ok: boolean };
  linear: { key: boolean; team: boolean; ok: boolean };
  zapier: { url: boolean; ok: boolean };
  objectStorage: { bucket: boolean; ok: boolean };
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
  const [simulating, setSimulating] = useState(false);
  const [simulation, setSimulation] = useState<{
    created: Array<{ id: string; amount: number; status: string }>;
    updated: Array<{ id: string; amount: number; status: string }>;
    transitions: Array<{ id: string; from: string; to: string }>;
  } | null>(null);
  const [importingOrders, setImportingOrders] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; rejected: number; processed: number } | null>(null);
  const [generatingOrders, setGeneratingOrders] = useState(false);
  const [processingOrders, setProcessingOrders] = useState(false);

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

  const statusLabel = (value: string) => {
    switch (value) {
      case "pending":
        return "결제 대기";
      case "paid":
        return "결제 완료";
      case "preparing":
        return "배송 준비";
      case "risk_review":
        return "리스크 검토";
      case "cancelled":
        return "취소";
      case "refunded":
        return "환불";
      default:
        return value;
    }
  };

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
        { ok: integrations.objectStorage.ok, label: "DEFAULT_OBJECT_STORAGE_BUCKET_ID" },
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
    "ADMIN_2FA_CODE (선택)",
    "JWT_SECRET 또는 SESSION_SECRET",
    "AI_INTEGRATIONS_OPENAI_API_KEY 또는 AI_INTEGRATIONS_OPENROUTER_API_KEY",
    "SLACK_WEBHOOK_URL 또는 SLACK_BOT_TOKEN + SLACK_CHANNEL_ID",
    "LINEAR_API_KEY + LINEAR_TEAM_ID",
    "ZAPIER_WEBHOOK_URL",
    "DEFAULT_OBJECT_STORAGE_BUCKET_ID",
    "SUPABASE_URL + SUPABASE_SERVICE_KEY (DB_PROVIDER=supabase 사용 시)",
  ];

  const envTemplate = [
    "ADMIN_PASSWORD=",
    "ADMIN_2FA_CODE=",
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
    "DEFAULT_OBJECT_STORAGE_BUCKET_ID=",
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
    "  status text not null check (status in ('pending','paid','preparing','risk_review','cancelled','refunded')),",
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

  const runSimulation = async () => {
    setSimulating(true);
    setSimulation(null);
    try {
      const resp = await fetch("/api/admin/orders/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10 }),
      });
      const data = await resp.json();
      setSimulation(data?.result || null);
      const ordersResp = await fetch("/api/admin/orders");
      const ordersData = await ordersResp.json();
      setOrders(ordersData.orders || []);
      await loadStats();
    } finally {
      setSimulating(false);
    }
  };

  const runOrderImport = async (file: File) => {
    setImportingOrders(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const resp = await fetch("/api/ai/orders/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await resp.json();
      setImportResult({
        created: data.created || 0,
        rejected: data.rejected || 0,
        processed: data.processed || 0,
      });
      await loadOrders();
      await loadStats();
    } finally {
      setImportingOrders(false);
    }
  };

  const runOrderGeneration = async () => {
    setGeneratingOrders(true);
    try {
      const resp = await fetch("/api/ai/orders/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10, avgAmount: 180 }),
      });
      await resp.json().catch(() => null);
      await loadOrders();
      await loadStats();
    } finally {
      setGeneratingOrders(false);
    }
  };

  const runAutoProcessing = async () => {
    setProcessingOrders(true);
    try {
      await fetch("/api/ai/orders/process", { method: "POST" });
      await loadOrders();
      await loadStats();
    } finally {
      setProcessingOrders(false);
    }
  };

  const loadStats = async () => {
    const resp = await fetch("/api/admin/stats");
    const data = await resp.json();
    const s = data?.stats;
    setStats(s && typeof s === "object" && !Array.isArray(s) ? s : null);
  };

  const loadOrders = async () => {
    const resp = await fetch("/api/admin/orders");
    const data = await resp.json();
    setOrders(data.orders || []);
  };

  useEffect(() => {
    loadStats();
    const id = setInterval(loadStats, 5000);
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
    <main className="replit-shell text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-64 flex-col gap-6 px-5 py-6 replit-sidebar">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-white/40">Admin</div>
            <div className="mt-3 text-lg font-semibold">Operations</div>
            <p className="mt-2 text-sm text-white/60">실시간 운영 센터</p>
          </div>
          <div className="space-y-2 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Dashboard</span>
              {integrations ? <span className="replit-pill px-2 py-0.5 text-[10px]">{integrations.ok ? "OK" : "Need"}</span> : null}
            </div>
            <div>Orders</div>
            <div>Customers</div>
            <div>Integrations</div>
          </div>
          <div className="mt-auto text-xs text-white/40">Region: ICN · Runtime: Next.js</div>
        </aside>
        <div className="flex-1 flex flex-col">
          <header className="replit-header h-14 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/60">fieldnine /</span>
              <span className="text-sm font-semibold">admin</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="replit-button h-9 px-4"
                onClick={loadIntegrations}
                disabled={integrationsLoading}
              >
                {integrationsLoading ? "확인 중..." : "상태 새로고침"}
              </button>
              {integrations ? statusPill(integrations.ok, integrations.ok ? "전체 OK" : "필수 설정 필요") : null}
            </div>
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="replit-panel rounded-3xl p-8">
                <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
                <p className="mt-2 text-sm text-white/70">fieldnine.io 운영 사령부</p>
                {stats ? (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="replit-card p-4 rounded-lg">
                      <div className="text-xs text-white/50">Customers</div>
                      <div className="text-2xl font-semibold">{stats.customers}</div>
                    </div>
                    <div className="replit-card p-4 rounded-lg">
                      <div className="text-xs text-white/50">Orders</div>
                      <div className="text-2xl font-semibold">{stats.orders}</div>
                    </div>
                    <div className="replit-card p-4 rounded-lg">
                      <div className="text-xs text-white/50">Revenue</div>
                      <div className="text-2xl font-semibold">${(stats.revenue ?? 0).toLocaleString()}</div>
                    </div>
                  </div>
                ) : null}
              </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold">미래 전략 센터 · VRD 26SS</h2>
          <p className="mt-2 text-sm text-white/60">
            2026-2027 패션 트렌드 신호를 기반으로 기획-제작-유통 로드맵을 조정합니다.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="replit-card p-4 rounded-xl">
              <div className="text-xs text-white/50">핵심 무드</div>
              <div className="mt-2 text-lg font-semibold">Warm Ivory Tech, Soft Armor</div>
              <p className="mt-2 text-sm text-white/60">미니멀 실루엣 + 유연한 보호감 + 광택 레이어.</p>
            </div>
            <div className="replit-card p-4 rounded-xl">
              <div className="text-xs text-white/50">소재 레이더</div>
              <div className="mt-2 text-lg font-semibold">Glass Knit, Aero Mesh</div>
              <p className="mt-2 text-sm text-white/60">투명 레이어와 통기성 구조를 결합.</p>
            </div>
            <div className="replit-card p-4 rounded-xl">
              <div className="text-xs text-white/50">성공 확률</div>
              <div className="mt-2 text-3xl font-semibold">87%</div>
              <p className="mt-2 text-sm text-white/60">핵심 구매 전환 지수 +12pt.</p>
            </div>
          </div>
          <div className="mt-4 replit-card p-4 rounded-xl">
            <h3 className="text-lg font-semibold">전략 액션</h3>
            <ul className="mt-2 text-sm text-white/60 list-disc pl-5">
              <li>26SS 컬렉션 캡슐 3종(모듈러 재킷/유연 방풍 셋업/커스터마이즈 스니커)</li>
              <li>메탈릭 뉴트럴 톤 팔레트로 유리 질감 강조</li>
              <li>사전 예약 캠페인 2주 앞당겨 리드 확보</li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold">인테그레이션 상태</h2>
          <div className="mt-3 flex items-center gap-3">
            {integrations ? statusPill(integrations.ok, integrations.ok ? "전체 OK" : "필수 설정 필요") : null}
            {integrationsUpdatedAt ? <span className="text-xs text-white/50">{integrationsUpdatedAt}</span> : null}
          </div>
          {integrations ? (
            <>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="replit-card p-4 rounded-xl">
                  <h3 className="text-lg font-semibold">플랫폼</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {statusPill(integrations.platform.vercel, "Vercel")}
                    {statusPill(integrations.platform.cloudflare, "Cloudflare")}
                  </div>
                </div>
                <div className="replit-card p-4 rounded-xl">
                  <h3 className="text-lg font-semibold">인증</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {statusPill(integrations.auth.admin, "ADMIN_PASSWORD")}
                    {statusPill(integrations.auth.secret, "JWT/SESSION")}
                    {statusPill(integrations.auth.twoFactor, "2FA")}
                  </div>
                </div>
                <div className="replit-card p-4 rounded-xl">
                  <h3 className="text-lg font-semibold">AI</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {statusPill(integrations.ai.openai, "OpenAI Key")}
                    {statusPill(integrations.ai.openaiBase, "OpenAI Base")}
                    {statusPill(integrations.ai.openrouter, "OpenRouter Key")}
                    {statusPill(integrations.ai.openrouterBase, "OpenRouter Base")}
                  </div>
                </div>
                <div className="replit-card p-4 rounded-xl">
                  <h3 className="text-lg font-semibold">알림/연동</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {statusPill(integrations.slack.ok, "Slack")}
                    {statusPill(integrations.linear.ok, "Linear")}
                    {statusPill(integrations.zapier.ok, "Zapier")}
                  </div>
                </div>
                <div className="replit-card p-4 rounded-xl">
                  <h3 className="text-lg font-semibold">Supabase</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {statusPill(integrations.supabase.enabled, "Provider")}
                    {statusPill(integrations.supabase.url, "URL")}
                    {statusPill(integrations.supabase.key, "Service Key")}
                    {statusPill(integrations.supabase.tables, "Tables")}
                  </div>
                </div>
              </div>
              <div className="mt-4 replit-card p-4 rounded-xl">
                <h3 className="text-lg font-semibold">누락 설정</h3>
                {missing.length > 0 ? (
                  <ul className="mt-2 text-sm text-white/60 list-disc pl-5">
                    {missing.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-white/60">모든 필수 설정 완료</p>
                )}
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="replit-card p-4 rounded-xl">
                  <h3 className="text-lg font-semibold">배포 체크리스트</h3>
                  <ul className="mt-2 text-sm text-white/60 list-disc pl-5">
                    {deployChecklist.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      className="replit-button h-9 px-4 inline-flex items-center justify-center"
                      onClick={copySupabaseSchema}
                    >
                      Supabase 스키마 복사
                    </button>
                    {sqlCopied ? <span className="text-xs text-white/50">복사됨</span> : null}
                  </div>
                </div>
                <div className="replit-card p-4 rounded-xl">
                  <h3 className="text-lg font-semibold">환경변수 체크리스트</h3>
                  <ul className="mt-2 text-sm text-white/60 list-disc pl-5">
                    {envChecklist.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      className="replit-button h-9 px-4 inline-flex items-center justify-center"
                      onClick={copyEnvTemplate}
                    >
                      env 템플릿 복사
                    </button>
                    {envCopied ? <span className="text-xs text-white/50">복사됨</span> : null}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="replit-card rounded-2xl p-4">
            <label className="text-sm font-medium">매출 지표 업로드 (JSON/CSV)</label>
            <input
              type="file"
              className="replit-input mt-2 w-full text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setSales(await parseFile(f));
              }}
            />
            {sales.length > 0 ? <BarChart data={sales} title="Sales" /> : null}
          </div>
          <div className="replit-card rounded-2xl p-4">
            <label className="text-sm font-medium">시장 트렌드 업로드 (JSON/CSV)</label>
            <input
              type="file"
              className="replit-input mt-2 w-full text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setTrends(await parseFile(f));
              }}
            />
            {trends.length > 0 ? <BarChart data={trends} title="Trends" /> : null}
          </div>
        </div>

        <div className="mt-8 replit-panel rounded-3xl p-8">
          <h2 className="text-xl font-semibold">운영 관리 패널</h2>
          <div className="mt-4 flex gap-3">
            <button
              className="replit-button h-9 px-4 inline-flex items-center justify-center"
              onClick={async () => {
                const r = await fetch("/api/admin/customers");
                const d = await r.json();
                setCustomers(d.customers || []);
              }}
            >
              고객 불러오기
            </button>
            <button
              className="replit-button h-9 px-4 inline-flex items-center justify-center"
              onClick={async () => {
                await loadOrders();
              }}
            >
              주문 불러오기
            </button>
            <button
              className="replit-button h-9 px-4 inline-flex items-center justify-center disabled:opacity-50"
              onClick={runOrderGeneration}
              disabled={generatingOrders}
            >
              {generatingOrders ? "생성 중..." : "AI 주문 생성"}
            </button>
            <button
              className="replit-button-primary h-9 px-4 inline-flex items-center justify-center disabled:opacity-50"
              onClick={runSimulation}
              disabled={simulating}
            >
              {simulating ? "시뮬레이션 중..." : "AI 주문 시뮬레이션"}
            </button>
            <button
              className="replit-button h-9 px-4 inline-flex items-center justify-center disabled:opacity-50"
              onClick={runAutoProcessing}
              disabled={processingOrders}
            >
              {processingOrders ? "처리 중..." : "AI 주문 자동 처리"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">주문 데이터 업로드 (JSON/CSV)</label>
            <input
              type="file"
              className="replit-input text-sm"
              accept=".json,.csv"
              disabled={importingOrders}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  await runOrderImport(f);
                  e.currentTarget.value = "";
                }
              }}
            />
            {importingOrders ? <span className="text-xs text-white/50">입력 중...</span> : null}
            {importResult ? (
              <span className="text-xs text-white/50">
                생성 {importResult.created} · 거절 {importResult.rejected} · 처리 {importResult.processed}
              </span>
            ) : null}
          </div>
          {simulation ? (
            <div className="mt-4 replit-card p-4 rounded-xl">
              <h3 className="text-lg font-semibold">AI 주문 시뮬레이션 로그</h3>
              <p className="mt-1 text-sm text-white/60">
                생성 {simulation.created.length}건 · 처리 {simulation.updated.length}건
              </p>
              <ul className="mt-3 text-sm text-white/60 list-disc pl-5">
                {simulation.transitions.map((t) => (
                  <li key={`${t.id}-${t.to}`}>
                    #{t.id.slice(0, 6)} {statusLabel(t.from)} → {statusLabel(t.to)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="replit-card p-4 rounded-xl">
              <h3 className="text-lg font-semibold">Customers</h3>
              <ul className="mt-2 text-sm text-white/60">
                {customers.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-1">
                    <span>{c.name} · {c.email}</span>
                    <button
                      className="replit-button text-xs px-3 py-1"
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
            <div className="replit-card p-4 rounded-xl">
              <h3 className="text-lg font-semibold">Orders</h3>
              <ul className="mt-2 text-sm text-white/60">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-1">
                    <span>#{o.id.slice(0, 6)} · ₩{o.amount} · {statusLabel(o.status)}</span>
                    <div className="flex gap-2">
                      <button
                        className="replit-button text-xs px-3 py-1"
                        onClick={async () => {
                          await fetch(`/api/admin/orders/${o.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "cancelled" }),
                          });
                          setOrders(orders.map((x) => (x.id === o.id ? { ...x, status: "cancelled" } : x)));
                          await loadStats();
                        }}
                        disabled={o.status !== "pending"}
                      >
                        취소
                      </button>
                      <button
                        className="replit-button text-xs px-3 py-1"
                        onClick={async () => {
                          await fetch(`/api/admin/orders/${o.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "preparing" }),
                          });
                          setOrders(orders.map((x) => (x.id === o.id ? { ...x, status: "preparing" } : x)));
                          await loadStats();
                        }}
                        disabled={o.status !== "paid" && o.status !== "risk_review"}
                      >
                        배송 준비
                      </button>
                      <button
                        className="replit-button text-xs px-3 py-1"
                        onClick={async () => {
                          await fetch(`/api/admin/orders/${o.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "risk_review" }),
                          });
                          setOrders(orders.map((x) => (x.id === o.id ? { ...x, status: "risk_review" } : x)));
                          await loadStats();
                        }}
                        disabled={o.status !== "paid"}
                      >
                        리스크 검토
                      </button>
                      <button
                        className="replit-button text-xs px-3 py-1"
                        onClick={async () => {
                          await fetch(`/api/admin/orders/${o.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "refunded" }),
                          });
                          setOrders(orders.map((x) => (x.id === o.id ? { ...x, status: "refunded" } : x)));
                          await loadStats();
                        }}
                        disabled={o.status !== "paid" && o.status !== "preparing" && o.status !== "risk_review"}
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
            className="replit-button-primary h-10 px-5 inline-flex items-center justify-center disabled:opacity-50"
            disabled={loading || sales.length === 0 || trends.length === 0}
            onClick={runAnalysis}
          >
            {loading ? "분석 중..." : "자비스 분석 실행"}
          </button>
          <button
            className="replit-button h-10 px-5 inline-flex items-center justify-center"
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
            <div className="replit-card p-4 rounded-xl">
              <h3 className="text-lg font-semibold">Executive Summary</h3>
              <ul className="mt-2 text-sm text-white/60 list-disc pl-5">
                {(analysis.ai?.summary || []).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="replit-card p-4 rounded-xl">
              <h3 className="text-lg font-semibold">Recommended Actions</h3>
              <ul className="mt-2 text-sm text-white/60 list-disc pl-5">
                {(analysis.ai?.actions || []).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="replit-card p-4 rounded-xl">
              <h3 className="text-lg font-semibold">Key Risks</h3>
              <ul className="mt-2 text-sm text-white/60 list-disc pl-5">
                {(analysis.ai?.risks || []).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="replit-card p-4 rounded-xl">
              <h3 className="text-lg font-semibold">Forecast</h3>
              <p className="mt-2 text-sm text-white/60">{analysis.ai?.forecast || "N/A"}</p>
            </div>
          </div>
        ) : null}
        {proactive ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="replit-card p-4 rounded-xl">
              <h3 className="text-lg font-semibold">Proactive Signals</h3>
              <ul className="mt-2 text-sm text-white/60 list-disc pl-5">
                {proactive.signals.slice(0, 5).map((s, i) => (
                  <li key={i}>{s.message}</li>
                ))}
              </ul>
            </div>
            <div className="replit-card p-4 rounded-xl">
              <h3 className="text-lg font-semibold">Forecast</h3>
              <p className="mt-2 text-sm text-white/60">
                다음 주 매출 ${(proactive.forecast?.nextRevenue ?? 0).toLocaleString()} · 신뢰도 {((proactive.forecast?.confidence ?? 0) * 100).toFixed(0)}%
              </p>
              <p className="mt-2 text-sm text-white/50">
                고객 {proactive.snapshot?.customers} · 주문 {proactive.snapshot?.orders} · 매출 ${(proactive.snapshot?.revenue ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
