-- ============================================
-- Field Nine: Commercial Stores Table (상용 SaaS 수준)
-- ============================================
-- 목적: 유저가 연동한 마켓플레이스 정보 (네이버, 쿠팡, 11번가 등)
-- 실행: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run

-- ============================================
-- 1. STORES TABLE (상용 수준)
-- ============================================
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 기본 정보
    store_name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN (
        'naver',           -- 네이버 스마트스토어
        'coupang',         -- 쿠팡
        '11st',            -- 11번가
        'gmarket',         -- 지마켓
        'auction',         -- 옥션
        'shopify',         -- 쇼피파이
        'woocommerce',     -- 우커머스
        'cafe24',          -- 카페24
        'make_shop',       -- 메이크샵
        'custom'           -- 커스텀 연동
    )),
    
    -- API 인증 정보 (암호화 권장)
    api_key TEXT,
    api_secret TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- 연동 설정
    store_id TEXT, -- 플랫폼에서 제공하는 스토어 ID
    seller_id TEXT, -- 판매자 ID
    webhook_url TEXT, -- 주문 알림을 받을 웹훅 URL
    webhook_secret TEXT, -- 웹훅 검증용 시크릿
    
    -- 동기화 설정
    is_active BOOLEAN DEFAULT TRUE,
    sync_enabled BOOLEAN DEFAULT TRUE, -- 자동 동기화 활성화 여부
    sync_interval_minutes INTEGER DEFAULT 15, -- 동기화 주기 (분)
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT, -- 'success', 'failed', 'partial'
    last_sync_error TEXT, -- 마지막 동기화 오류 메시지
    
    -- 플랫폼별 수수료율 (JSONB로 저장)
    -- 예: {"commission_rate": 0.11, "payment_fee_rate": 0.03, "shipping_fee_rate": 0.0}
    fee_settings JSONB DEFAULT '{}'::jsonb,
    
    -- 추가 메타데이터
    metadata JSONB DEFAULT '{}'::jsonb, -- 플랫폼별 추가 설정
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 제약 조건
    CONSTRAINT unique_user_store_name UNIQUE (user_id, store_name),
    CONSTRAINT valid_sync_interval CHECK (sync_interval_minutes >= 1 AND sync_interval_minutes <= 1440)
);

-- ============================================
-- 2. INDEXES (성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_platform ON public.stores(platform);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON public.stores(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_sync_enabled ON public.stores(sync_enabled);
CREATE INDEX IF NOT EXISTS idx_stores_last_sync_at ON public.stores(last_sync_at DESC);
CREATE INDEX IF NOT EXISTS idx_stores_user_platform ON public.stores(user_id, platform);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own stores" ON public.stores;
DROP POLICY IF EXISTS "Users can insert own stores" ON public.stores;
DROP POLICY IF EXISTS "Users can update own stores" ON public.stores;
DROP POLICY IF EXISTS "Users can delete own stores" ON public.stores;

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
DROP TRIGGER IF EXISTS update_stores_updated_at ON public.stores;
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. SYNC STATUS UPDATE FUNCTION
-- ============================================
-- 동기화 완료 시 last_sync_at 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_store_sync_status(
    p_store_id UUID,
    p_status TEXT,
    p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.stores
    SET 
        last_sync_at = NOW(),
        last_sync_status = p_status,
        last_sync_error = p_error,
        updated_at = NOW()
    WHERE id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 완료!
-- ============================================
