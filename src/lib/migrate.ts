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
    id: "097",
    label: "collab_docs 테이블 생성",
    sql: `
      CREATE TABLE IF NOT EXISTS collab_docs (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        slug       TEXT        UNIQUE NOT NULL,
        title      TEXT        NOT NULL DEFAULT 'Untitled',
        content    TEXT        DEFAULT '',
        owner_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_collab_docs_slug ON collab_docs(slug);
      ALTER TABLE collab_docs ENABLE ROW LEVEL SECURITY;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename='collab_docs' AND policyname='Public read collab docs'
        ) THEN
          CREATE POLICY "Public read collab docs"
            ON collab_docs FOR SELECT
            USING (true);
        END IF;
      END $$;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename='collab_docs' AND policyname='Auth write collab docs'
        ) THEN
          CREATE POLICY "Auth write collab docs"
            ON collab_docs FOR ALL
            USING (auth.uid() IS NOT NULL)
            WITH CHECK (auth.uid() IS NOT NULL);
        END IF;
      END $$;
      CREATE OR REPLACE FUNCTION update_collab_docs_updated_at()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
      DROP TRIGGER IF EXISTS trg_collab_docs_updated_at ON collab_docs;
      CREATE TRIGGER trg_collab_docs_updated_at
        BEFORE UPDATE ON collab_docs
        FOR EACH ROW EXECUTE FUNCTION update_collab_docs_updated_at();
    `,
  },
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
  {
    id: "099a",
    label: "process_refund 원자적 RPC 함수",
    sql: `
      CREATE OR REPLACE FUNCTION process_refund(
        p_user_id UUID,
        p_subscription_id TEXT,
        p_reason TEXT DEFAULT '사용자 요청',
        p_amount INTEGER DEFAULT 0
      ) RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $fn$
      DECLARE
        v_current_plan TEXT;
      BEGIN
        SELECT plan INTO v_current_plan FROM profiles WHERE id = p_user_id FOR UPDATE;
        IF v_current_plan IS NULL THEN
          RETURN jsonb_build_object('ok', false, 'error', 'no_active_plan');
        END IF;
        UPDATE profiles SET plan = NULL, updated_at = NOW() WHERE id = p_user_id;
        UPDATE subscriptions
          SET status = 'refunded', updated_at = NOW()
          WHERE user_id = p_user_id AND stripe_subscription_id = p_subscription_id;
        INSERT INTO billing_events (user_id, type, amount, description, created_at)
        VALUES (p_user_id, 'refund', p_amount, p_reason, NOW());
        RETURN jsonb_build_object('ok', true, 'previous_plan', v_current_plan);
      END;
      $fn$;
    `,
  },
  {
    id: "100a",
    label: "CHECK 제약조건 + 인덱스 추가",
    sql: `
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_subscription_status'
        ) THEN
          ALTER TABLE subscriptions
            ADD CONSTRAINT chk_subscription_status
            CHECK (status IN ('active','past_due','canceled','refunded','expired','trialing'));
        END IF;
      END $$;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_billing_event_type'
        ) THEN
          ALTER TABLE billing_events
            ADD CONSTRAINT chk_billing_event_type
            CHECK (type IN ('payment','refund','top_up','usage','subscription_created','subscription_canceled'));
        END IF;
      END $$;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_nonnegative_tokens'
        ) THEN
          ALTER TABLE profiles
            ADD CONSTRAINT chk_nonnegative_tokens
            CHECK (tokens >= 0);
        END IF;
      END $$;
      CREATE INDEX IF NOT EXISTS idx_billing_events_user_type ON billing_events(user_id, type);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
      CREATE INDEX IF NOT EXISTS idx_cowork_docs_shared ON cowork_docs(is_shared) WHERE is_shared = true;
    `,
  },
  {
    id: "100b",
    label: "lab 토너먼트 스키마",
    sql: `
      CREATE TABLE IF NOT EXISTS lab_tournaments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        season INT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending','play_in','round_8','semi','final','completed')),
        champion_team_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        completed_at TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS lab_teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tournament_id UUID NOT NULL REFERENCES lab_tournaments(id) ON DELETE CASCADE,
        seed INT NOT NULL CHECK (seed BETWEEN 1 AND 10),
        agent_ids INT[] NOT NULL,
        team_name TEXT NOT NULL,
        eliminated BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS lab_matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tournament_id UUID NOT NULL REFERENCES lab_tournaments(id) ON DELETE CASCADE,
        round TEXT NOT NULL CHECK (round IN ('play_in','round_8','semi','final')),
        match_order INT NOT NULL,
        team_a_id UUID REFERENCES lab_teams(id),
        team_b_id UUID REFERENCES lab_teams(id),
        winner_id UUID REFERENCES lab_teams(id),
        score_a JSONB,
        score_b JSONB,
        reasoning TEXT,
        executed BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS lab_innovations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tournament_id UUID NOT NULL REFERENCES lab_tournaments(id) ON DELETE CASCADE,
        match_id UUID REFERENCES lab_matches(id),
        team_id UUID REFERENCES lab_teams(id),
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        architecture TEXT,
        code_snippet TEXT,
        tech_stack TEXT[] DEFAULT '{}',
        scores JSONB,
        round_reached TEXT NOT NULL CHECK (round_reached IN ('play_in','round_8','semi','final')),
        maturity INT NOT NULL DEFAULT 0 CHECK (maturity BETWEEN 0 AND 100),
        can_reenter BOOLEAN NOT NULL DEFAULT false,
        finalized BOOLEAN NOT NULL DEFAULT false,
        parent_id UUID REFERENCES lab_innovations(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_lab_teams_tournament ON lab_teams(tournament_id);
      CREATE INDEX IF NOT EXISTS idx_lab_matches_tournament ON lab_matches(tournament_id);
      CREATE INDEX IF NOT EXISTS idx_lab_innovations_tournament ON lab_innovations(tournament_id);
      CREATE INDEX IF NOT EXISTS idx_lab_innovations_reenter ON lab_innovations(can_reenter) WHERE can_reenter = true AND finalized = false;
      CREATE INDEX IF NOT EXISTS idx_lab_innovations_breakthrough ON lab_innovations(round_reached) WHERE round_reached IN ('semi','final');
    `,
  },
];

/** 테이블/컬럼 존재 여부 확인 (서비스롤 REST API) */
async function checkMigrationNeeded(id: string): Promise<boolean> {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return true;

  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  if (id === "097") {
    const r = await fetch(`${url}/rest/v1/collab_docs?limit=0`, { headers }).catch(() => null);
    return !r || r.status !== 200;
  }
  if (id === "098") {
    const r = await fetch(`${url}/rest/v1/cowork_docs?limit=0`, { headers }).catch(() => null);
    return !r || r.status !== 200;
  }
  if (id === "099") {
    const r = await fetch(`${url}/rest/v1/profiles?select=trial_ends_at&limit=1`, { headers }).catch(() => null);
    if (!r) return true;
    const txt = await r.text();
    return txt.includes("42703"); // column does not exist
  }
  if (id === "099a") {
    // RPC 함수는 POST /rest/v1/rpc/process_refund 으로 존재 여부 확인
    const r = await fetch(`${url}/rest/v1/rpc/process_refund`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ p_user_id: "00000000-0000-0000-0000-000000000000", p_subscription_id: "__check__" }),
    }).catch(() => null);
    // 404 = function not found → 필요, 그 외(400/422 등) = 이미 존재
    return !r || r.status === 404;
  }
  if (id === "100a") {
    // CHECK 제약조건 존재 여부 — subscriptions 테이블에 chk_subscription_status 확인 불가 (REST)
    // 항상 idempotent SQL 이므로 재실행해도 안전
    return true;
  }
  if (id === "100b") {
    const r = await fetch(`${url}/rest/v1/lab_tournaments?limit=0`, { headers }).catch(() => null);
    return !r || r.status !== 200;
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
