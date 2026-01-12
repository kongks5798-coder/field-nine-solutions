-- ============================================
-- Field Nine AI Analysis Dashboard Schema V2
-- Tesla/Apple Grade Production Schema
-- 100x Scale Ready, Monopoly Architecture
-- ============================================

-- ============================================
-- 1. AI 인사이트 테이블 (Enhanced)
-- 비즈니스 목적: AI가 생성한 모든 인사이트 중앙 관리
-- 확장성: 1백만 row/user 대응, 파티셔닝 고려
-- ============================================
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 인사이트 분류
    insight_type TEXT NOT NULL CHECK (insight_type IN (
        'trend_prediction',      -- 트렌드 예측
        'anomaly_detection',     -- 이상 감지
        'opportunity',           -- 비즈니스 기회
        'risk_alert',            -- 리스크 경고
        'recommendation',        -- 추천 액션
        'performance_analysis',  -- 성과 분석
        'competitor_intel'       -- 경쟁사 정보
    )),
    category TEXT NOT NULL CHECK (category IN (
        'fashion', 'color', 'item', 'platform', 
        'marketing', 'inventory', 'pricing', 'customer'
    )),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- 인사이트 내용
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL(5, 4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1), -- 0.0000 ~ 1.0000
    
    -- 데이터 소스 (트레이서빌리티)
    source_hashtags TEXT[],
    source_platforms TEXT[],
    source_urls TEXT[], -- 원본 데이터 URL
    analysis_period_start TIMESTAMP WITH TIME ZONE,
    analysis_period_end TIMESTAMP WITH TIME ZONE,
    
    -- 액션 가능한 데이터 (JSONB로 유연성 확보)
    actionable_data JSONB DEFAULT '{}'::jsonb,
    /* 예시 구조:
    {
        "suggested_actions": [
            {"action": "increase_stock", "target": "상품A", "quantity": 50}
        ],
        "expected_impact": {
            "revenue_increase": 1500000,
            "roi_percent": 25.5
        },
        "implementation_complexity": "low|medium|high",
        "estimated_time_hours": 2
    }
    */
    
    -- 상태 관리
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'dismissed', 'resolved', 'expired')),
    is_read BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- 비즈니스 임팩트 추적
    actual_impact JSONB, -- 실제 비즈니스 임팩트 기록 (나중에 업데이트)
    roi_validated BOOLEAN DEFAULT false,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- 인사이트 유효기간
    
    -- AI 모델 정보 (Model Versioning)
    model_version TEXT DEFAULT 'v1.0',
    model_name TEXT DEFAULT 'field_nine_ai'
);

-- 인덱스 (쿼리 성능 최적화 - 100x Scale)
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type_priority ON ai_insights(insight_type, priority DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status_created ON ai_insights(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_category_confidence ON ai_insights(category, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_expires_at ON ai_insights(expires_at) WHERE expires_at IS NOT NULL;

-- GIN 인덱스 (JSONB 쿼리 가속)
CREATE INDEX IF NOT EXISTS idx_ai_insights_actionable_data_gin ON ai_insights USING GIN (actionable_data);

-- ============================================
-- 2. 트렌드 시계열 데이터 (Time Series Optimized)
-- 비즈니스 목적: 모든 메트릭의 시계열 데이터 저장 및 예측
-- 확장성: TimescaleDB 호환 구조, 파티셔닝 준비
-- ============================================
CREATE TABLE IF NOT EXISTS trend_time_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 시계열 메타데이터
    metric_type TEXT NOT NULL CHECK (metric_type IN (
        'hashtag_popularity',    -- 해시태그 인기도
        'color_trend',           -- 색상 트렌드
        'item_trend',            -- 아이템 트렌드
        'platform_activity',     -- 플랫폼 활동
        'engagement_rate',       -- 참여율
        'conversion_rate',       -- 전환율
        'sales_volume',          -- 매출량
        'inventory_turnover',    -- 재고 회전율
        'customer_sentiment'     -- 고객 감성
    )),
    metric_key TEXT NOT NULL, -- 해시태그명, 색상명, 아이템명 등
    platform TEXT NOT NULL DEFAULT 'instagram' CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'naver', 'all')),
    
    -- 시계열 데이터 포인트
    date DATE NOT NULL,
    time TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 시간까지 포함 (선택적)
    value DECIMAL(20, 6) NOT NULL, -- 메트릭 값 (소수점 6자리까지)
    change_percent DECIMAL(10, 4), -- 전일 대비 변화율 (%)
    change_absolute DECIMAL(20, 6), -- 전일 대비 절대 변화량
    
    -- 통계 데이터
    moving_average_7d DECIMAL(20, 6), -- 7일 이동평균
    moving_average_30d DECIMAL(20, 6), -- 30일 이동평균
    volatility DECIMAL(10, 4), -- 변동성 지표
    
    -- AI 예측 데이터
    predicted_value DECIMAL(20, 6), -- 다음 기간 예측값
    prediction_confidence DECIMAL(5, 4) CHECK (prediction_confidence >= 0 AND prediction_confidence <= 1),
    prediction_interval_lower DECIMAL(20, 6), -- 예측 구간 하한
    prediction_interval_upper DECIMAL(20, 6), -- 예측 구간 상한
    
    -- 데이터 품질
    sample_size INTEGER CHECK (sample_size >= 0),
    data_quality_score DECIMAL(5, 4) CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
    outlier_flag BOOLEAN DEFAULT false, -- 이상치 플래그
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 복합 유니크 제약
    UNIQUE(user_id, metric_type, metric_key, platform, date)
);

-- 인덱스 (Time Series Query Optimization)
CREATE INDEX IF NOT EXISTS idx_trend_ts_user_date ON trend_time_series(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_trend_ts_metric_date ON trend_time_series(metric_type, metric_key, date DESC);
CREATE INDEX IF NOT EXISTS idx_trend_ts_platform_date ON trend_time_series(platform, date DESC);
CREATE INDEX IF NOT EXISTS idx_trend_ts_composite ON trend_time_series(user_id, metric_type, platform, date DESC);

-- ============================================
-- 3. AI 예측 결과 (Forecast Tracking)
-- 비즈니스 목적: AI 예측의 정확도 추적 및 모델 개선
-- ============================================
CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 예측 메타데이터
    prediction_type TEXT NOT NULL CHECK (prediction_type IN (
        'trend_forecast',        -- 트렌드 예측
        'demand_forecast',       -- 수요 예측
        'price_forecast',        -- 가격 예측
        'seasonal_pattern',      -- 계절성 패턴
        'inventory_forecast',    -- 재고 예측
        'revenue_forecast'       -- 매출 예측
    )),
    target_entity TEXT NOT NULL, -- 예측 대상 (해시태그, 색상, 아이템, 상품ID 등)
    target_platform TEXT NOT NULL DEFAULT 'instagram',
    
    -- 예측 기간
    forecast_start DATE NOT NULL,
    forecast_end DATE NOT NULL,
    forecast_horizon INTEGER NOT NULL CHECK (forecast_horizon > 0), -- 예측 기간 (일 단위)
    
    -- 예측 결과
    predicted_value DECIMAL(20, 6) NOT NULL,
    confidence_interval_lower DECIMAL(20, 6),
    confidence_interval_upper DECIMAL(20, 6),
    confidence_level DECIMAL(5, 4) NOT NULL DEFAULT 0.95 CHECK (confidence_level >= 0 AND confidence_level <= 1),
    
    -- 예측 모델 정보
    model_version TEXT NOT NULL DEFAULT 'v1.0',
    model_name TEXT NOT NULL DEFAULT 'field_nine_forecaster',
    model_accuracy DECIMAL(5, 4) CHECK (model_accuracy >= 0 AND model_accuracy <= 1),
    training_data_points INTEGER,
    
    -- 실제값과 비교 (Validation & Learning)
    actual_value DECIMAL(20, 6),
    prediction_error DECIMAL(20, 6), -- 실제값 - 예측값
    prediction_accuracy DECIMAL(5, 4) CHECK (prediction_accuracy >= 0 AND prediction_accuracy <= 1),
    mape DECIMAL(10, 4), -- Mean Absolute Percentage Error
    
    -- 비즈니스 임팩트
    business_impact JSONB DEFAULT '{}'::jsonb,
    /* 예시 구조:
    {
        "expected_revenue": 5000000,
        "actual_revenue": 5200000,
        "roi": 104.0,
        "actions_taken": ["increased_stock", "launched_campaign"]
    }
    */
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE, -- 실제값으로 검증된 시점
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_predictions_user_type ON ai_predictions(user_id, prediction_type);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_target ON ai_predictions(target_entity, target_platform);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_forecast_dates ON ai_predictions(forecast_start, forecast_end);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_validated ON ai_predictions(validated_at) WHERE validated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_predictions_model ON ai_predictions(model_name, model_version);

-- GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_predictions_business_impact_gin ON ai_predictions USING GIN (business_impact);

-- ============================================
-- 4. 분석 세션 (Analysis Job Tracking)
-- 비즈니스 목적: 모든 분석 작업 추적 및 성능 모니터링
-- ============================================
CREATE TABLE IF NOT EXISTS analysis_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 세션 메타데이터
    session_name TEXT,
    session_type TEXT NOT NULL DEFAULT 'manual' CHECK (session_type IN ('manual', 'scheduled', 'automated', 'api')),
    
    -- 분석 범위
    hashtags TEXT[] NOT NULL,
    platforms TEXT[] NOT NULL DEFAULT ARRAY['instagram'],
    date_range_start DATE,
    date_range_end DATE,
    
    -- 분석 파라미터 (재현성)
    analysis_params JSONB DEFAULT '{}'::jsonb,
    /* 예시:
    {
        "confidence_threshold": 0.85,
        "max_posts": 1000,
        "include_comments": true,
        "language": "ko"
    }
    */
    
    -- 분석 결과 요약
    total_posts_analyzed INTEGER DEFAULT 0,
    unique_colors_detected INTEGER DEFAULT 0,
    unique_items_detected INTEGER DEFAULT 0,
    average_confidence DECIMAL(5, 4),
    
    -- 세션 상태
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'timeout')),
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    
    -- 성능 메트릭
    processing_time_seconds INTEGER, -- 처리 시간 (초)
    data_processed_mb DECIMAL(10, 2), -- 처리된 데이터 크기 (MB)
    api_calls_made INTEGER DEFAULT 0, -- 외부 API 호출 횟수
    
    -- 에러 정보
    error_message TEXT,
    error_stack TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- 메타데이터
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_status ON analysis_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_created_at ON analysis_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_type_status ON analysis_sessions(session_type, status);

-- ============================================
-- 5. 대시보드 설정 (User Preferences)
-- 비즈니스 목적: 개인화된 대시보드 경험 제공
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- 대시보드 레이아웃 설정
    layout_config JSONB DEFAULT '{
        "widgets": [
            {"id": "insights", "x": 0, "y": 0, "w": 12, "h": 4},
            {"id": "trends", "x": 0, "y": 4, "w": 6, "h": 6},
            {"id": "predictions", "x": 6, "y": 4, "w": 6, "h": 6}
        ],
        "theme": "tesla"
    }'::jsonb,
    
    default_date_range INTEGER DEFAULT 7 CHECK (default_date_range > 0), -- 기본 날짜 범위 (일)
    default_platforms TEXT[] DEFAULT ARRAY['instagram', 'tiktok'],
    default_hashtags TEXT[] DEFAULT ARRAY[], -- 즐겨찾기 해시태그
    
    -- 알림 설정
    notification_enabled BOOLEAN DEFAULT true,
    notification_types TEXT[] DEFAULT ARRAY['high_priority_insights', 'trend_alerts', 'prediction_updates'],
    notification_channels TEXT[] DEFAULT ARRAY['in_app', 'email'], -- 'in_app', 'email', 'sms', 'slack'
    email_digest_frequency TEXT DEFAULT 'daily' CHECK (email_digest_frequency IN ('none', 'daily', 'weekly', 'monthly')),
    
    -- 차트 설정 (Tesla Style)
    chart_preferences JSONB DEFAULT '{
        "theme": "minimal",
        "color_scheme": "tesla",
        "animation_enabled": true,
        "show_confidence_intervals": true,
        "default_metric": "hashtag_popularity"
    }'::jsonb,
    
    -- AI 설정
    ai_preferences JSONB DEFAULT '{
        "auto_generate_insights": true,
        "insight_min_confidence": 0.80,
        "prediction_horizon_days": 30,
        "preferred_models": ["field_nine_forecaster"]
    }'::jsonb,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_dashboard_settings_user_id ON dashboard_settings(user_id);

-- ============================================
-- 6. 비즈니스 임팩트 추적 (NEW - ROI 측정)
-- 비즈니스 목적: AI 인사이트의 실제 비즈니스 가치 측정
-- ============================================
CREATE TABLE IF NOT EXISTS business_impact_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_id UUID REFERENCES ai_insights(id) ON DELETE SET NULL,
    prediction_id UUID REFERENCES ai_predictions(id) ON DELETE SET NULL,
    
    -- 액션 정보
    action_taken TEXT NOT NULL, -- '재고_증가', '할인_캠페인_실행' 등
    action_details JSONB DEFAULT '{}'::jsonb,
    action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 임팩트 측정
    expected_revenue DECIMAL(15, 2),
    actual_revenue DECIMAL(15, 2),
    expected_cost DECIMAL(15, 2),
    actual_cost DECIMAL(15, 2),
    roi_percent DECIMAL(10, 2), -- (actual_revenue - actual_cost) / actual_cost * 100
    
    -- 기타 KPI
    customer_acquisition INTEGER,
    customer_retention_rate DECIMAL(5, 4),
    conversion_rate_change DECIMAL(10, 4),
    
    -- 검증 상태
    validated BOOLEAN DEFAULT false,
    validated_at TIMESTAMP WITH TIME ZONE,
    validation_method TEXT, -- 'manual', 'automated', 'external_tool'
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_business_impact_user ON business_impact_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_business_impact_insight ON business_impact_tracking(insight_id);
CREATE INDEX IF NOT EXISTS idx_business_impact_validated ON business_impact_tracking(validated, validated_at);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- AI Insights
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own insights" ON ai_insights
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trend Time Series
ALTER TABLE trend_time_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own time series" ON trend_time_series
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AI Predictions
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own predictions" ON ai_predictions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Analysis Sessions
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own sessions" ON analysis_sessions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Dashboard Settings
ALTER TABLE dashboard_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own settings" ON dashboard_settings
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Business Impact Tracking
ALTER TABLE business_impact_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own impact tracking" ON business_impact_tracking
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 트리거: updated_at 자동 갱신
-- ============================================
CREATE TRIGGER update_ai_insights_updated_at
    BEFORE UPDATE ON ai_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_predictions_updated_at
    BEFORE UPDATE ON ai_predictions
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

CREATE TRIGGER update_business_impact_tracking_updated_at
    BEFORE UPDATE ON business_impact_tracking
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
    priority,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_read = false) as unread_count,
    COUNT(*) FILTER (WHERE status = 'active') as active_count,
    AVG(confidence) as avg_confidence,
    MAX(created_at) as latest_insight_at,
    MIN(expires_at) as next_expiry_at
FROM ai_insights
WHERE status IN ('active', 'acknowledged')
GROUP BY user_id, insight_type, priority;

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
    STDDEV(value) as stddev_value,
    AVG(change_percent) as avg_change_percent,
    MAX(date) as latest_date,
    AVG(prediction_confidence) FILTER (WHERE predicted_value IS NOT NULL) as avg_prediction_confidence
FROM trend_time_series
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, metric_type, metric_key, platform;

-- 예측 정확도 뷰
CREATE OR REPLACE VIEW ai_prediction_accuracy_summary AS
SELECT 
    user_id,
    prediction_type,
    model_name,
    model_version,
    COUNT(*) as total_predictions,
    COUNT(*) FILTER (WHERE validated_at IS NOT NULL) as validated_count,
    AVG(prediction_accuracy) FILTER (WHERE prediction_accuracy IS NOT NULL) as avg_accuracy,
    AVG(mape) FILTER (WHERE mape IS NOT NULL) as avg_mape,
    MIN(forecast_start) as earliest_forecast,
    MAX(forecast_end) as latest_forecast
FROM ai_predictions
GROUP BY user_id, prediction_type, model_name, model_version;

-- 비즈니스 ROI 요약 뷰
CREATE OR REPLACE VIEW business_roi_summary AS
SELECT 
    user_id,
    action_taken,
    COUNT(*) as action_count,
    SUM(actual_revenue) as total_revenue,
    SUM(actual_cost) as total_cost,
    AVG(roi_percent) as avg_roi_percent,
    SUM(customer_acquisition) as total_customers_acquired,
    AVG(conversion_rate_change) as avg_conversion_rate_change
FROM business_impact_tracking
WHERE validated = true
GROUP BY user_id, action_taken;

-- ============================================
-- 성능 최적화: Partial Indexes
-- ============================================

-- 활성 인사이트만 인덱싱 (90% 쿼리 대상)
CREATE INDEX IF NOT EXISTS idx_ai_insights_active_unread 
ON ai_insights(user_id, created_at DESC) 
WHERE status = 'active' AND is_read = false;

-- 예측값이 있는 시계열만 인덱싱
CREATE INDEX IF NOT EXISTS idx_trend_ts_with_prediction 
ON trend_time_series(user_id, metric_type, date DESC) 
WHERE predicted_value IS NOT NULL;

-- 완료된 세션만 인덱싱 (히스토리 조회용)
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_completed 
ON analysis_sessions(user_id, completed_at DESC) 
WHERE status = 'completed';

-- ============================================
-- 마이그레이션 & 백업 지침
-- ============================================

COMMENT ON TABLE ai_insights IS 'AI가 생성한 모든 인사이트 저장. Monopoly 전략 핵심 데이터.';
COMMENT ON TABLE trend_time_series IS '시계열 트렌드 데이터. TimescaleDB로 마이그레이션 고려.';
COMMENT ON TABLE ai_predictions IS 'AI 예측 결과 및 정확도 추적. 모델 개선에 필수.';
COMMENT ON TABLE business_impact_tracking IS '비즈니스 ROI 측정. Field Nine의 가치 증명 데이터.';

-- ============================================
-- 성공 메시지
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Field Nine AI Dashboard Schema V2 설치 완료';
    RAISE NOTICE '- 6개 핵심 테이블 생성 완료';
    RAISE NOTICE '- 100x Scale Ready 인덱싱 완료';
    RAISE NOTICE '- RLS 보안 정책 적용 완료';
    RAISE NOTICE '- Tesla Grade Production Schema 구축 완료';
    RAISE NOTICE '=================================================';
END $$;
