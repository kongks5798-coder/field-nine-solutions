-- Field Nine: 통합 마케팅 분석 SaaS - ClickHouse Schema
-- OLAP: 대용량 성과 데이터 분석

CREATE DATABASE IF NOT EXISTS fieldnine_analytics;

-- 통합 마케팅 성과 데이터 (UMDM)
CREATE TABLE IF NOT EXISTS fieldnine_analytics.marketing_facts (
    -- 식별자 컬럼
    tenant_id UUID,                -- 테넌트 격리 (최우선 파티션 키)
    platform Enum8('meta' = 1, 'google' = 2, 'naver' = 3, 'cafe24' = 4),
    account_id String,
    campaign_id String,
    adset_id String,
    ad_id String,
    
    -- 차원 (Dimensions)
    date Date,
    hour UInt8,
    currency String DEFAULT 'KRW',
    
    -- 측정값 (Metrics) - Nullable 지양 (0 기본값)
    impressions UInt64 DEFAULT 0,
    clicks UInt64 DEFAULT 0,
    spend Float64 DEFAULT 0.0,
    conversions UInt64 DEFAULT 0,
    revenue Float64 DEFAULT 0.0,
    
    -- 통합 지표 (계산 필드)
    ctr Float64 DEFAULT 0.0,           -- Click-Through Rate
    cpc Float64 DEFAULT 0.0,           -- Cost Per Click
    cpa Float64 DEFAULT 0.0,           -- Cost Per Acquisition
    roas Float64 DEFAULT 0.0,          -- Return on Ad Spend
    
    -- 메타데이터 (비정규화 - 조회 성능 향상)
    campaign_name String,
    adset_name String,
    ad_name String,
    
    -- 타임스탬프
    ingested_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date) -- 월별 파티셔닝
ORDER BY (tenant_id, platform, date, campaign_id, ad_id) -- tenant_id 최우선 정렬
SETTINGS index_granularity = 8192;

-- 인덱스 최적화
ALTER TABLE fieldnine_analytics.marketing_facts ADD INDEX idx_tenant_platform (tenant_id, platform) TYPE minmax GRANULARITY 4;
ALTER TABLE fieldnine_analytics.marketing_facts ADD INDEX idx_date (date) TYPE minmax GRANULARITY 4;

-- 뷰: 일별 집계 (성능 최적화)
CREATE MATERIALIZED VIEW IF NOT EXISTS fieldnine_analytics.marketing_facts_daily
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (tenant_id, platform, date, campaign_id, ad_id)
AS SELECT
    tenant_id,
    platform,
    account_id,
    campaign_id,
    adset_id,
    ad_id,
    date,
    currency,
    campaign_name,
    adset_name,
    ad_name,
    sum(impressions) as impressions,
    sum(clicks) as clicks,
    sum(spend) as spend,
    sum(conversions) as conversions,
    sum(revenue) as revenue,
    sum(clicks) / sum(impressions) as ctr,
    sum(spend) / sum(clicks) as cpc,
    sum(spend) / sum(conversions) as cpa,
    sum(revenue) / sum(spend) as roas
FROM fieldnine_analytics.marketing_facts
GROUP BY
    tenant_id, platform, account_id, campaign_id, adset_id, ad_id,
    date, currency, campaign_name, adset_name, ad_name;
