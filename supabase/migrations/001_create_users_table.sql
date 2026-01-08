-- ============================================
-- Field Nine: Users Table & Auto-Creation Trigger
-- ============================================
-- 목적: 로그인 시 자동으로 users 테이블에 유저 정보 생성
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run

-- ============================================
-- 1. USERS TABLE (상용 SaaS용 확장된 유저 정보)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    full_name TEXT,
    plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial')),
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- ============================================
-- 2. INDEXES (성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON public.users(plan_type);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);

-- ============================================
-- 3. AUTO-CREATE USER FUNCTION
-- ============================================
-- 로그인 시 auth.users에 유저가 생성되면 자동으로 public.users에도 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, avatar_url, full_name, last_login_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        last_login_at = NOW(),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. TRIGGER (auth.users INSERT 시 자동 실행)
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. UPDATE LAST LOGIN FUNCTION
-- ============================================
-- 로그인할 때마다 last_login_at 업데이트
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET last_login_at = NOW(), updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 정보만 조회 가능
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- 사용자는 자신의 정보만 수정 가능 (plan_type, subscription_status는 제외)
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        -- plan_type과 subscription_status는 관리자만 수정 가능
        (OLD.plan_type = NEW.plan_type OR auth.jwt() ->> 'role' = 'admin') AND
        (OLD.subscription_status = NEW.subscription_status OR auth.jwt() ->> 'role' = 'admin')
    );

-- ============================================
-- 7. UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 완료!
-- ============================================
-- 이제 로그인하면 자동으로 public.users 테이블에 유저 정보가 생성됩니다.
