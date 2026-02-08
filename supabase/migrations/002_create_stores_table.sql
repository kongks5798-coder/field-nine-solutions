-- ============================================
-- Field Nine: Stores Table (쇼핑몰 연동 정보)
-- ============================================
-- 목적: 유저가 연동한 쇼핑몰 정보 저장
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run

-- ============================================
-- 1. STORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('naver', 'coupang', 'shopify', 'woocommerce', 'custom')),
    api_key TEXT, -- 암호화된 API Key
    api_secret TEXT, -- 암호화된 API Secret
    webhook_url TEXT, -- 주문 알림을 받을 웹훅 URL
    is_active BOOLEAN DEFAULT TRUE,
    sync_enabled BOOLEAN DEFAULT TRUE, -- 자동 동기화 활성화 여부
    last_sync_at TIMESTAMPTZ,
    metadata JSONB, -- 플랫폼별 추가 설정
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_store_name UNIQUE (user_id, store_name)
);

-- ============================================
-- 2. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_platform ON public.stores(platform);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON public.stores(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_last_sync_at ON public.stores(last_sync_at DESC);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 스토어만 조회 가능
CREATE POLICY "Users can view own stores"
    ON public.stores FOR SELECT
    USING (auth.uid() = user_id);

-- 사용자는 자신의 스토어만 생성 가능
CREATE POLICY "Users can insert own stores"
    ON public.stores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 스토어만 수정 가능
CREATE POLICY "Users can update own stores"
    ON public.stores FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 스토어만 삭제 가능
CREATE POLICY "Users can delete own stores"
    ON public.stores FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 완료!
-- ============================================
