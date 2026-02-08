-- TrendStream Supabase Schema
-- PostgreSQL 데이터베이스 스키마

-- 사용자 분석 히스토리 테이블
CREATE TABLE IF NOT EXISTS analysis_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    hashtag TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'instagram',
    
    -- 분석 결과
    top_colors TEXT[] NOT NULL,
    top_items TEXT[] NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL,
    analyzed_posts INTEGER NOT NULL,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at ON analysis_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_history_hashtag ON analysis_history(hashtag);

-- RLS (Row Level Security) 활성화
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 분석 히스토리만 조회 가능
CREATE POLICY "Users can view their own analysis history"
    ON analysis_history
    FOR SELECT
    USING (auth.uid() = user_id);

-- 정책: 사용자는 자신의 분석 히스토리만 생성 가능
CREATE POLICY "Users can insert their own analysis history"
    ON analysis_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 트렌드 예측 결과 캐시 테이블 (공개 데이터)
CREATE TABLE IF NOT EXISTS trend_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hashtag TEXT NOT NULL,
    platform TEXT NOT NULL,
    
    -- 예측 결과
    top_colors TEXT[] NOT NULL,
    top_items TEXT[] NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL,
    
    -- 캐시 메타데이터
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_trend_cache_hashtag_platform ON trend_cache(hashtag, platform);
CREATE INDEX IF NOT EXISTS idx_trend_cache_expires_at ON trend_cache(expires_at);

-- RLS: 트렌드 캐시는 모든 사용자가 조회 가능 (읽기 전용)
ALTER TABLE trend_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trend cache"
    ON trend_cache
    FOR SELECT
    USING (true);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: updated_at 자동 갱신
CREATE TRIGGER update_analysis_history_updated_at
    BEFORE UPDATE ON analysis_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
