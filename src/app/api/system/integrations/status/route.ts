import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";

export const runtime = "edge";

function parseCookies(cookieHeader: string | null): Array<{ name: string; value: string }> {
  if (!cookieHeader) return [];
  return cookieHeader.split(";").map((c) => {
    const [name, ...rest] = c.trim().split("=");
    return { name: name.trim(), value: rest.join("=").trim() };
  });
}

function normalizeEnv(value: string | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  return trimmed.replace(/^['"`]+|['"`]+$/g, "").trim();
}

function normalizeSupabaseUrl(value: string | undefined) {
  const clean = normalizeEnv(value);
  return clean.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

async function checkSupabase() {
  const provider = (normalizeEnv(process.env.DB_PROVIDER) || "memory").toLowerCase();
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const key = normalizeEnv(process.env.SUPABASE_SERVICE_KEY);
  if (provider !== "supabase") return { enabled: false, url: !!url, key: !!key, tables: false, ok: false };
  if (!url || !key) return { enabled: true, url: !!url, key: !!key, tables: false, ok: false };
  try {
    const headers = { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` };
    const resp = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/orders?select=id&limit=1`, { headers });
    const ok = resp.ok;
    return { enabled: true, url: true, key: true, tables: ok, ok };
  } catch {
    return { enabled: true, url: true, key: true, tables: false, ok: false };
  }
}

function checkSlack() {
  const webhook = !!(process.env.SLACK_WEBHOOK_URL || "");
  const bot = !!(process.env.SLACK_BOT_TOKEN || "");
  const channel = !!(process.env.SLACK_CHANNEL_ID || "");
  return { webhook, bot, channel, ok: webhook || (bot && channel) };
}

function checkLinear() {
  const key = !!(process.env.LINEAR_API_KEY || "");
  const team = !!(process.env.LINEAR_TEAM_ID || "");
  return { key, team, ok: key && team };
}

function checkZapier() {
  const url = !!(process.env.ZAPIER_WEBHOOK_URL || "");
  return { url, ok: url };
}

function checkObjectStorage() {
  const bucket = !!normalizeEnv(process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID);
  return { bucket, ok: bucket };
}

function checkAI() {
  const openai = !!(process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "");
  const openaiBase = !!(process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "");
  const or = !!(process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY || "");
  const orBase = !!(process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL || "");
  return { openai, openaiBase, openrouter: or, openrouterBase: orBase, ok: openai || or };
}

function checkAuth() {
  const admin = !!(process.env.ADMIN_PASSWORD || "");
  const secret = !!(process.env.JWT_SECRET || process.env.SESSION_SECRET || "");
  const twoFactor = !!(process.env.ADMIN_2FA_CODE || "");
  return { admin, secret, twoFactor, ok: admin && secret };
}

function checkPlatform(headers: Headers) {
  const vercel = (process.env.VERCEL || "") === "1";
  const cf = !!headers.get("cf-connecting-ip");
  return { vercel, cloudflare: cf };
}

export async function GET(req: Request) {
  // Supabase 인증 확인 — 로그인한 사용자만 접근 가능
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => parseCookies(req.headers.get("cookie")), setAll: () => {} } },
  );
  const { data: { session } } = await supabaseAuth.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:integrations:status:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const supabase = await checkSupabase();
  const slack = checkSlack();
  const linear = checkLinear();
  const zapier = checkZapier();
  const objectStorage = checkObjectStorage();
  const ai = checkAI();
  const auth = checkAuth();
  const platform = checkPlatform(req.headers);
  const allOk =
    auth.ok &&
    ai.ok &&
    slack.ok &&
    linear.ok &&
    zapier.ok &&
    objectStorage.ok &&
    (!supabase.enabled || (supabase.enabled && supabase.ok));

  // 응답 최소화: 각 통합별 ok 상태만 반환 (내부 필드 노출 방지)
  return NextResponse.json({
    ok: allOk,
    platform,
    auth: { ok: auth.ok },
    ai: { ok: ai.ok },
    slack: { ok: slack.ok },
    linear: { ok: linear.ok },
    zapier: { ok: zapier.ok },
    objectStorage: { ok: objectStorage.ok },
    supabase: { ok: supabase.ok },
  });
}
