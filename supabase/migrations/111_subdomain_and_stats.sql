-- profiles 테이블에 subdomain 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_pending_change TEXT;

-- generation_history 테이블 RLS 확인 (이미 있으면 스킵)
-- app_bookmarks 테이블 RLS 확인 (이미 있으면 스킵)

-- subdomain 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_subdomain ON profiles(subdomain) WHERE subdomain IS NOT NULL;

-- weekly_report_sent_at 컬럼 (주간 리포트 발송 추적)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_report_sent_at TIMESTAMPTZ;
