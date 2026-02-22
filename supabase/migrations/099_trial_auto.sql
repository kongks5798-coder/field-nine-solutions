-- 099_trial_auto.sql
-- 신규 가입 시 14일 Pro 무료 체험 자동 부여 트리거

-- profiles 테이블에 trial 컬럼 추가 (없으면)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_started_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_converted   BOOLEAN NOT NULL DEFAULT false;

-- 신규 프로필 생성 시 자동으로 14일 Pro 체험 부여
CREATE OR REPLACE FUNCTION auto_grant_trial()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- 이미 플랜이 있으면 건너뜀
  IF NEW.plan IS NOT NULL THEN
    RETURN NEW;
  END IF;

  NEW.plan             := 'pro';
  NEW.plan_expires_at  := NOW() + INTERVAL '14 days';
  NEW.plan_updated_at  := NOW();
  NEW.trial_started_at := NOW();
  NEW.trial_ends_at    := NOW() + INTERVAL '14 days';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_trial ON profiles;
CREATE TRIGGER trg_auto_trial
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION auto_grant_trial();

-- 만료 크론 함수에서 trial 만료 시 trial_converted 체크 로직 지원을 위한 뷰
CREATE OR REPLACE VIEW trial_status AS
SELECT
  id,
  email,
  plan,
  trial_started_at,
  trial_ends_at,
  trial_converted,
  CASE
    WHEN trial_ends_at IS NOT NULL AND trial_ends_at < NOW() AND plan = 'pro' AND NOT trial_converted
    THEN true
    ELSE false
  END AS trial_expired
FROM profiles;
