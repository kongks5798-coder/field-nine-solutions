/**
 * Supabase 마이그레이션 자동 실행기
 * SUPABASE_DATABASE_URL 환경변수로 직접 PostgreSQL 연결 후 DDL 실행
 * 각 마이그레이션은 idempotent (IF NOT EXISTS / OR REPLACE)
 */

export interface MigrationResult {
  id: string;
  label: string;
  status: "ok" | "skip" | "error";
  message?: string;
}

const MIGRATIONS: Array<{ id: string; label: string; sql: string }> = [
  {
    id: "098",
    label: "cowork_docs 테이블 생성",
    sql: `
      CREATE TABLE IF NOT EXISTS cowork_docs (
        id          BIGSERIAL   PRIMARY KEY,
        title       TEXT        NOT NULL DEFAULT '새 문서',
        emoji       TEXT        NOT NULL DEFAULT '📄',
        content     TEXT        NOT NULL DEFAULT '',
        user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
        is_shared   BOOLEAN     NOT NULL DEFAULT false,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cowork_docs_user    ON cowork_docs(user_id);
      CREATE INDEX IF NOT EXISTS idx_cowork_docs_updated ON cowork_docs(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_cowork_docs_shared  ON cowork_docs(is_shared) WHERE is_shared = true;
      ALTER TABLE cowork_docs ENABLE ROW LEVEL SECURITY;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename='cowork_docs' AND policyname='cowork: owner full access'
        ) THEN
          CREATE POLICY "cowork: owner full access"
            ON cowork_docs FOR ALL
            USING  (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
        END IF;
      END $$;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename='cowork_docs' AND policyname='cowork: shared docs readable'
        ) THEN
          CREATE POLICY "cowork: shared docs readable"
            ON cowork_docs FOR SELECT
            USING (is_shared = true AND auth.uid() IS NOT NULL);
        END IF;
      END $$;
      CREATE OR REPLACE FUNCTION update_cowork_docs_updated_at()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
      DROP TRIGGER IF EXISTS trg_cowork_docs_updated_at ON cowork_docs;
      CREATE TRIGGER trg_cowork_docs_updated_at
        BEFORE UPDATE ON cowork_docs
        FOR EACH ROW EXECUTE FUNCTION update_cowork_docs_updated_at();
    `,
  },
  {
    id: "099",
    label: "profiles 체험 컬럼 + 자동 트리거",
    sql: `
      ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS trial_ends_at    TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS trial_converted  BOOLEAN NOT NULL DEFAULT false;
      CREATE OR REPLACE FUNCTION auto_grant_trial()
      RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
      BEGIN
        IF NEW.plan IS NOT NULL THEN RETURN NEW; END IF;
        NEW.plan             := 'pro';
        NEW.plan_expires_at  := NOW() + INTERVAL '14 days';
        NEW.plan_updated_at  := NOW();
        NEW.trial_started_at := NOW();
        NEW.trial_ends_at    := NOW() + INTERVAL '14 days';
        RETURN NEW;
      END; $$;
      DROP TRIGGER IF EXISTS trg_auto_trial ON profiles;
      CREATE TRIGGER trg_auto_trial
        BEFORE INSERT ON profiles
        FOR EACH ROW EXECUTE FUNCTION auto_grant_trial();
      CREATE OR REPLACE VIEW trial_status AS
      SELECT
        id, email, plan, trial_started_at, trial_ends_at, trial_converted,
        CASE
          WHEN trial_ends_at IS NOT NULL AND trial_ends_at < NOW() AND plan = 'pro' AND NOT trial_converted
          THEN true ELSE false
        END AS trial_expired
      FROM profiles;
    `,
  },
];

/** 테이블/컬럼 존재 여부 확인 (서비스롤 REST API) */
async function checkMigrationNeeded(id: string): Promise<boolean> {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return true;

  if (id === "098") {
    const r = await fetch(`${url}/rest/v1/cowork_docs?limit=0`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    }).catch(() => null);
    return !r || r.status !== 200; // 404 → 필요
  }
  if (id === "099") {
    const r = await fetch(`${url}/rest/v1/profiles?select=trial_ends_at&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    }).catch(() => null);
    if (!r) return true;
    const txt = await r.text();
    return txt.includes("42703"); // column does not exist
  }
  return true;
}

/** 마이그레이션 실행 (postgres 패키지 사용) */
export async function runMigrations(): Promise<MigrationResult[]> {
  const dbUrl = process.env.SUPABASE_DATABASE_URL;
  if (!dbUrl) {
    return MIGRATIONS.map((m) => ({
      id: m.id,
      label: m.label,
      status: "skip" as const,
      message: "SUPABASE_DATABASE_URL 미설정",
    }));
  }

  // Dynamic import to avoid bundling issues when env var not set
  const { default: postgres } = await import("postgres");
  const sql = postgres(dbUrl, { max: 1, idle_timeout: 10, connect_timeout: 10 });

  const results: MigrationResult[] = [];

  for (const migration of MIGRATIONS) {
    try {
      const needed = await checkMigrationNeeded(migration.id);
      if (!needed) {
        results.push({ id: migration.id, label: migration.label, status: "skip", message: "이미 적용됨" });
        continue;
      }

      await sql.unsafe(migration.sql);
      results.push({ id: migration.id, label: migration.label, status: "ok" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ id: migration.id, label: migration.label, status: "error", message: msg });
    }
  }

  await sql.end();
  return results;
}
