#!/usr/bin/env node
/**
 * Supabase 마이그레이션 자동 실행기
 * service_role key로 REST API를 통해 SQL 실행
 * 사용: node scripts/run-migration.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

// .env.local에서 env 읽기
function loadEnv() {
  try {
    const raw = readFileSync(join(__dir, "../.env.local"), "utf-8");
    const env = {};
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) env[key] = val;
    }
    return env;
  } catch { return {}; }
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ SUPABASE_URL 또는 SERVICE_ROLE_KEY 미설정");
  process.exit(1);
}

// SQL을 Supabase pg_net 대신 임시 RPC 함수로 실행하는 방법
// → 대신 Supabase Management API 사용
const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!PROJECT_REF) { console.error("❌ PROJECT_REF 추출 실패"); process.exit(1); }

async function execSQL(sql, label) {
  // Supabase Management REST API: /pg endpoint (service_role 권한)
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_migration`;

  // 대안: 직접 SQL 실행을 위한 임시 함수를 먼저 생성
  // Step 1: exec_migration 함수 생성
  const createFnSql = `
    CREATE OR REPLACE FUNCTION exec_migration(query text)
    RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN EXECUTE query; END; $$;
  `;

  // service_role로 함수 먼저 생성
  const r1 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_migration`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!r1.ok) {
    const err = await r1.json().catch(() => ({}));
    // 함수 없으면 먼저 만들어야 함
    if (err.code === "PGRST202") {
      return { ok: false, needsBootstrap: true };
    }
    return { ok: false, error: err };
  }
  return { ok: true };
}

// Bootstrap: exec_migration 함수 자체를 생성 (PostgreSQL admin API 필요)
// Supabase SQL Editor API 사용
async function bootstrapAndRun(sqls) {
  const MGMT_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

  // Supabase Access Token 필요 - 환경에 없으면 다른 방법 시도
  const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN;

  if (ACCESS_TOKEN) {
    console.log("📡 Management API로 SQL 실행 중...");
    for (const { sql, label } of sqls) {
      const r = await fetch(MGMT_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
      });
      const result = await r.json().catch(() => ({}));
      if (r.ok) {
        console.log(`✅ ${label}`);
      } else {
        console.log(`⚠️  ${label}: ${JSON.stringify(result).slice(0, 100)}`);
      }
    }
    return;
  }

  // Access Token 없음 → 마이그레이션 API Route를 임시 생성해서 호출
  console.log("⚠️  SUPABASE_ACCESS_TOKEN 미설정");
  console.log("📋 Supabase 대시보드 → SQL Editor에서 아래 SQL을 실행해주세요:\n");
  for (const { sql, label } of sqls) {
    console.log(`-- ═══ ${label} ═══`);
    console.log(sql);
    console.log();
  }
}

// 마이그레이션 SQL 로드
const MIGRATIONS = [
  {
    label: "098_cowork_docs",
    sql: readFileSync(join(__dir, "../supabase/migrations/098_cowork_docs.sql"), "utf-8"),
  },
  {
    label: "099_trial_auto",
    sql: readFileSync(join(__dir, "../supabase/migrations/099_trial_auto.sql"), "utf-8"),
  },
];

console.log("🚀 FieldNine 마이그레이션 실행기");
console.log(`📦 프로젝트: ${PROJECT_REF}`);
console.log(`📋 마이그레이션: ${MIGRATIONS.map(m => m.label).join(", ")}\n`);

await bootstrapAndRun(MIGRATIONS);
