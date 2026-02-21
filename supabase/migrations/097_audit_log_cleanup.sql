-- 097: audit_log 자동 정리 (pg_cron + 파티션 대안)
-- audit_log 테이블에 90일 초과 로그를 매일 03:00 UTC에 삭제
-- pg_cron 확장이 활성화된 Supabase 프로젝트에서 실행

-- pg_cron 확장 활성화 (이미 활성화된 경우 무시)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 기존 동일 이름의 cron job이 있으면 제거
SELECT cron.unschedule('audit_log_cleanup')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'audit_log_cleanup'
);

-- 매일 03:00 UTC에 90일 초과 audit_log 삭제
SELECT cron.schedule(
  'audit_log_cleanup',
  '0 3 * * *',
  $$
    DELETE FROM public.audit_log
    WHERE created_at < NOW() - INTERVAL '90 days';
  $$
);

-- audit_log 파티셔닝 준비: created_at 인덱스 최적화 (BRIN — 대용량 시계열 데이터에 효율적)
CREATE INDEX IF NOT EXISTS audit_log_created_at_brin
  ON public.audit_log USING brin (created_at);

COMMENT ON TABLE public.audit_log IS
  'Security audit log. Entries older than 90 days are auto-purged by pg_cron job "audit_log_cleanup".';
