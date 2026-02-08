-- ============================================
-- K-UNIVERSAL AUTH USER SYNC TRIGGER V2
-- auth.users → public.users/profiles 자동 동기화
-- @version 2.0.0 - Production Grade
-- ============================================
--
-- 목적:
-- 1. 신규 유저 가입 시 public.users 자동 생성
-- 2. 신규 유저 가입 시 profiles 자동 생성
-- 3. 신규 유저 가입 시 wallets 자동 생성
-- 4. OAuth 메타데이터 동기화 (카카오, 구글)
-- 5. 로그인 시 last_login_at 자동 갱신
--
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run
-- ============================================

-- ============================================
-- 1. PROFILES TABLE (존재하지 않으면 생성)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  preferred_language TEXT DEFAULT 'ko' CHECK (preferred_language IN ('ko', 'en', 'ja', 'zh')),
  notification_settings JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
  kyc_status TEXT DEFAULT 'not_submitted' CHECK (kyc_status IN ('not_submitted', 'pending', 'approved', 'rejected')),
  kyc_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- 2. UNIFIED USER HANDLER (ENHANCED)
-- auth.users INSERT/UPDATE 시 실행
-- ============================================
CREATE OR REPLACE FUNCTION handle_auth_user_change()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_avatar_url TEXT;
  v_phone TEXT;
  v_provider TEXT;
BEGIN
  -- 1. Provider 확인 (OAuth vs Email)
  v_provider := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    'email'
  );

  -- 2. 이름 추출 (우선순위: full_name > name > nickname > email prefix)
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'nickname',
    -- 카카오 전용
    NEW.raw_user_meta_data->'kakao_account'->'profile'->>'nickname',
    -- 이메일의 @ 앞부분
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- 3. 아바타 URL 추출
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    -- 카카오 전용
    NEW.raw_user_meta_data->'kakao_account'->'profile'->>'profile_image_url'
  );

  -- 4. 전화번호 추출 (있으면)
  v_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->'kakao_account'->>'phone_number'
  );

  -- ============================================
  -- A. public.users 테이블 동기화
  -- ============================================
  INSERT INTO public.users (
    id,
    email,
    full_name,
    avatar_url,
    last_login_at
  ) VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_avatar_url,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    last_login_at = NOW(),
    updated_at = NOW();

  -- ============================================
  -- B. profiles 테이블 동기화
  -- ============================================
  INSERT INTO profiles (
    id,
    email,
    full_name,
    avatar_url,
    phone,
    preferred_language
  ) VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_avatar_url,
    v_phone,
    'ko'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();

  -- ============================================
  -- C. wallets 테이블 동기화 (신규 유저만)
  -- ============================================
  IF TG_OP = 'INSERT' THEN
    INSERT INTO wallets (user_id, balance, currency, status)
    VALUES (NEW.id, 0.00, 'KRW', 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- 로그 출력 (디버깅용)
  RAISE NOTICE '[Auth Sync] User % synced via % (name: %, email: %)',
    NEW.id, v_provider, v_full_name, NEW.email;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- 에러 발생해도 인증은 진행 (서비스 중단 방지)
  RAISE WARNING '[Auth Sync] Error syncing user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. TRIGGER (기존 트리거 교체)
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;

CREATE TRIGGER on_auth_user_sync
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_change();

-- ============================================
-- 4. ROW LEVEL SECURITY FOR PROFILES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거 (IF EXISTS)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 새 정책 추가
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 5. INDEXES FOR PROFILES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language ON profiles(preferred_language);

-- ============================================
-- 6. UPDATED_AT TRIGGER FOR PROFILES
-- ============================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. 기존 auth.users를 profiles/users에 동기화
-- (이미 가입한 유저가 있을 경우를 위한 백필)
-- ============================================
INSERT INTO profiles (id, email, full_name, avatar_url)
SELECT
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    SPLIT_PART(email, '@', 1)
  ),
  COALESCE(
    raw_user_meta_data->>'avatar_url',
    raw_user_meta_data->>'picture'
  )
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- users 테이블에도 백필
INSERT INTO public.users (id, email, full_name, avatar_url)
SELECT
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    SPLIT_PART(email, '@', 1)
  ),
  COALESCE(
    raw_user_meta_data->>'avatar_url',
    raw_user_meta_data->>'picture'
  )
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- wallets 테이블에도 백필
INSERT INTO wallets (user_id, balance, currency, status)
SELECT id, 0.00, 'KRW', 'active'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 완료!
-- ============================================
-- 이제 모든 인증 방식(이메일, 카카오, 구글)에서
-- 자동으로 users, profiles, wallets 테이블이 동기화됩니다.
--
-- 테스트 방법:
-- 1. 새 유저로 가입
-- 2. SELECT * FROM profiles WHERE id = '<user_id>';
-- 3. SELECT * FROM public.users WHERE id = '<user_id>';
-- 4. SELECT * FROM wallets WHERE user_id = '<user_id>';
-- ============================================
