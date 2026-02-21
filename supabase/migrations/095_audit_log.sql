-- ============================================================
-- Migration 095: 보안 감사 로그 (Audit Log)
-- ============================================================
-- 인증 실패, rate limit 초과, 권한 오류 등 보안 이벤트를 기록
-- 서비스 역할(service_role)만 쓰기/읽기 가능

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,   -- 'auth.login', 'auth.denied', 'rate_limited', 'admin.access', etc.
  resource    TEXT,                   -- 요청 경로 (예: /api/ai/stream)
  ip          TEXT,
  user_agent  TEXT,
  status_code INTEGER,
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS audit_log_user_created   ON public.audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_created ON public.audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_created        ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_ip             ON public.audit_log(ip, created_at DESC);

-- RLS: 서비스 역할만 접근 가능 (사용자 스스로도 읽기 불가 — 보안 감사 무결성 보호)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_service_only" ON public.audit_log;
CREATE POLICY "audit_service_only" ON public.audit_log FOR ALL USING (auth.role() = 'service_role');

-- 90일 이후 자동 삭제를 위한 파티셔닝 또는 Supabase pg_cron 설정 권장:
-- SELECT cron.schedule('audit-log-cleanup', '0 3 * * *',
--   $$DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '90 days'$$);

COMMENT ON TABLE public.audit_log IS '보안 감사 로그 — 인증/인가/rate limit 이벤트 기록';
