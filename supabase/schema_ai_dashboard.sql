-- Field Nine: AI Analysis Dashboard Schema
-- PostgreSQL 데이터베이스 스키마 확장
-- AI 분석 대시보드를 위한 고급 데이터 구조

-- ============================================
-- 1. AI 분석 인사이트 테이블 (AI Insights)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 인사이트 메타데이터
    insight_type TEXT NOT NULL CHECK (insight_type IN ('trend_prediction', 'anomaly_detection', 'opportunity', 'risk_alert', 'recommendation')),
    category TEXT NOT NULL, -- 'fashion', 'color', 'item', 'platform', 'general'
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- 인사이트 내용
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    
    -- 데이터 소스
    source_hashtags TEXT[],
    source_platforms TEXT[],
    analysis_period_start TIMESTAMP WITH TIME ZONE,
    analysis_period_end TIMESTAMP WITH TIME ZONE,
    
    -- 액션 가능한 데이터
    actionable_data JSONB, -- { "suggested_actions": [...], "expected_impact": {...} }
    
    -- 상태 관리
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'dismissed', 'resolved')),
    is_read BOOLEAN DEFAULT false,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- 인사이트 유효기간
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_priority ON ai_insights(priority DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON ai_insights(status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_category ON ai_insights(category);

-- ============================================
-- 2. 트렌드 시계열 데이터 테이블 (Trend Time Series)
-- ============================================
CREATE TABLE IF NOT EXISTS trend_time_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 시계열 메타데이터
    metric_type TEXT NOT NULL CHECK (metric_type IN ('hashtag_popularity', 'color_trend', 'item_trend', 'platform_activity', 'engagement_rate')),
    metric_key TEXT NOT NULL, -- 해시태그, 색상, 아이템명 등
    platform TEXT NOT NULL DEFAULT 'instagram',
    
    -- 시계열 데이터 포인트
    date DATE NOT NULL,
    value DECIMAL(15, 4) NOT NULL, -- 메트릭 값
    change_percent DECIMAL(10, 4), -- 전일 대비 변화율
    change_absolute DECIMAL(15, 4), -- 전일 대비 절대 변화량
    
    -- 예측 데이터 (AI 생성)
    predicted_value DECIMAL(15, 4), -- 다음 기간 예측값
    prediction_confidence DECIMAL(3, 2), -- 예측 신뢰도
    
    -- 메타데이터
    sample_size INTEGER, -- 분석 샘플 크기
    data_quality_score DECIMAL(3, 2), -- 데이터 품질 점수
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 복합 유니크 제약: 같은 날짜, 같은 메트릭은 중복 방지
    UNIQUE(user_id, metric_type, metric_key, platform, date)
);

-- 인덱스 (시계열 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_trend_time_series_user_id ON trend_time_series(user_id);
CREATE INDEX IF NOT EXISTS idx_trend_time_series_metric ON trend_time_series(metric_type, metric_key);
CREATE INDEX IF NOT EXISTS idx_trend_time_series_date ON trend_time_series(date DESC);
CREATE INDEX IF NOT EXISTS idx_trend_time_series_user_date ON trend_time_series(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_trend_time_series_platform ON trend_time_series(platform);

-- ============================================
-- 3. AI 예측 결과 테이블 (AI Predictions)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 예측 메타데이터
    prediction_type TEXT NOT NULL CHECK (prediction_type IN ('trend_forecast', 'demand_forecast', 'price_forecast', 'seasonal_pattern')),
    target_entity TEXT NOT NULL, -- 예측 대상 (해시태그, 색상, 아이템 등)
    target_platform TEXT NOT NULL DEFAULT 'instagram',
    
    -- 예측 기간
    forecast_start DATE NOT NULL,
    forecast_end DATE NOT NULL,
    forecast_horizon INTEGER NOT NULL, -- 예측 기간 (일 단위)
    
    -- 예측 결과
    predicted_value DECIMAL(15, 4) NOT NULL,
    confidence_interval_lower DECIMAL(15, 4),
    confidence_interval_upper DECIMAL(15, 4),
    confidence_level DECIMAL(3, 2) NOT NULL DEFAULT 0.95,
    
    -- 예측 모델 정보
    model_version TEXT, -- 사용된 AI 모델 버전
    model_accuracy DECIMAL(3, 2), -- 모델 정확도
    
    -- 실제값과 비교 (나중에 업데이트)
    actual_value DECIMAL(15, 4),
    prediction_error DECIMAL(15, 4), -- 실제값 - 예측값
    prediction_accuracy DECIMAL(3, 2), -- 예측 정확도
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE -- 실제값으로 검증된 시점
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_predictions_user_id ON ai_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_target ON ai_predictions(target_entity, target_platform);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_forecast_start ON ai_predictions(forecast_start);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at ON ai_predictions(created_at DESC);

-- ============================================
-- 4. 분석 세션 테이블 (Analysis Sessions)
-- ============================================
CREATE TABLE IF NOT EXISTS analysis_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 세션 메타데이터
    session_name TEXT,
    session_type TEXT NOT NULL DEFAULT 'manual' CHECK (session_type IN ('manual', 'scheduled', 'automated')),
    
    -- 분석 범위
    hashtags TEXT[] NOT NULL,
    platforms TEXT[] NOT NULL DEFAULT ARRAY['instagram'],
    date_range_start DATE,
    date_range_end DATE,
    
    -- 분석 결과 요약
    total_posts_analyzed INTEGER DEFAULT 0,
    unique_colors_detected INTEGER DEFAULT 0,
    unique_items_detected INTEGER DEFAULT 0,
    average_confidence DECIMAL(3, 2),
    
    -- 세션 상태
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    
    -- 에러 정보
    error_message TEXT,
    
    -- 메타데이터
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_id ON analysis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_status ON analysis_sessions(status);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_created_at ON analysis_sessions(created_at DESC);

-- ============================================
-- 5. 대시보드 설정 테이블 (Dashboard Settings)
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- 대시보드 레이아웃 설정
    layout_config JSONB DEFAULT '{}'::jsonb, -- 위젯 배치 정보
    default_date_range INTEGER DEFAULT 7, -- 기본 날짜 범위 (일)
    default_platforms TEXT[] DEFAULT ARRAY['instagram', 'tiktok'],
    
    -- 알림 설정
    notification_enabled BOOLEAN DEFAULT true,
    notification_types TEXT[] DEFAULT ARRAY['high_priority_insights', 'trend_alerts'],
    
    -- 차트 설정
    chart_preferences JSONB DEFAULT '{
        "theme": "minimal",
        "color_scheme": "tesla",
        "animation_enabled": true
    }'::jsonb,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_dashboard_settings_user_id ON dashboard_settings(user_id);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- AI Insights
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own insights"
    ON ai_insights FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own insights"
    ON ai_insights FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own insights"
    ON ai_insights FOR UPDATE
    USING (auth.uid() = user_id);

-- Trend Time Series
ALTER TABLE trend_time_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own time series"
    ON trend_time_series FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own time series"
    ON trend_time_series FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- AI Predictions
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own predictions"
    ON ai_predictions FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own predictions"
    ON ai_predictions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own predictions"
    ON ai_predictions FOR UPDATE
    USING (auth.uid() = user_id);

-- Analysis Sessions
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sessions"
    ON analysis_sessions FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions"
    ON analysis_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions"
    ON analysis_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Dashboard Settings
ALTER TABLE dashboard_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own settings"
    ON dashboard_settings FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings"
    ON dashboard_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings"
    ON dashboard_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- 트리거: updated_at 자동 갱신
-- ============================================
CREATE TRIGGER update_ai_insights_updated_at
    BEFORE UPDATE ON ai_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_sessions_updated_at
    BEFORE UPDATE ON analysis_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_settings_updated_at
    BEFORE UPDATE ON dashboard_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 뷰: 대시보드 집계 뷰 (성능 최적화)
-- ============================================

-- 최근 인사이트 요약 뷰
CREATE OR REPLACE VIEW dashboard_insights_summary AS
SELECT 
    user_id,
    insight_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_read = false) as unread_count,
    COUNT(*) FILTER (WHERE priority = 'critical') as critical_count,
    COUNT(*) FILTER (WHERE priority = 'high') as high_count,
    MAX(created_at) as latest_insight_at
FROM ai_insights
WHERE status = 'active'
GROUP BY user_id, insight_type;

-- 트렌드 요약 뷰 (최근 30일)
CREATE OR REPLACE VIEW dashboard_trends_summary AS
SELECT 
    user_id,
    metric_type,
    metric_key,
    platform,
    COUNT(*) as data_points,
    AVG(value) as avg_value,
    MAX(value) as max_value,
    MIN(value) as min_value,
    AVG(change_percent) as avg_change_percent,
    MAX(date) as latest_date
FROM trend_time_series
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, metric_type, metric_key, platform;
