-- ============================================
-- Panopticon CEO Dashboard Schema
-- Field Nine Solutions
-- ============================================

-- 재무 데이터 스냅샷
CREATE TABLE IF NOT EXISTS panopticon_financial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_revenue BIGINT NOT NULL DEFAULT 0,
  monthly_expense BIGINT NOT NULL DEFAULT 0,
  operating_margin DECIMAL(5,2) DEFAULT 0,
  previous_month_revenue BIGINT DEFAULT 0,
  target_revenue BIGINT DEFAULT 0,
  labor_expense BIGINT DEFAULT 0,
  rent_expense BIGINT DEFAULT 0,
  logistics_expense BIGINT DEFAULT 0,
  other_expense BIGINT DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 무신사 랭킹 히스토리
CREATE TABLE IF NOT EXISTS panopticon_musinsa_ranking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_rank INTEGER NOT NULL,
  category_rank INTEGER NOT NULL,
  category VARCHAR(100) DEFAULT '아우터',
  previous_rank INTEGER,
  change_direction VARCHAR(10) CHECK (change_direction IN ('up', 'down', 'same')),
  change_amount INTEGER DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 무신사 매출 히스토리
CREATE TABLE IF NOT EXISTS panopticon_musinsa_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_sales BIGINT DEFAULT 0,
  today_sales BIGINT DEFAULT 0,
  week_sales BIGINT DEFAULT 0,
  month_sales BIGINT DEFAULT 0,
  settlement_amount BIGINT DEFAULT 0,
  pending_settlement BIGINT DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CS/클레임 리포트
CREATE TABLE IF NOT EXISTS panopticon_cs_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_cases INTEGER DEFAULT 0,
  pending_cases INTEGER DEFAULT 0,
  urgent_cases INTEGER DEFAULT 0,
  today_cases INTEGER DEFAULT 0,
  delivery_cases INTEGER DEFAULT 0,
  quality_cases INTEGER DEFAULT 0,
  exchange_cases INTEGER DEFAULT 0,
  refund_cases INTEGER DEFAULT 0,
  other_cases INTEGER DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 서버 상태 로그
CREATE TABLE IF NOT EXISTS panopticon_server_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_name VARCHAR(100) DEFAULT 'RTX 5090 Server',
  status VARCHAR(20) CHECK (status IN ('online', 'offline', 'warning')) DEFAULT 'online',
  cpu_usage DECIMAL(5,2) DEFAULT 0,
  memory_usage DECIMAL(5,2) DEFAULT 0,
  gpu_usage DECIMAL(5,2),
  temperature DECIMAL(5,2),
  uptime_seconds BIGINT DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 생산 현황 트래킹
CREATE TABLE IF NOT EXISTS panopticon_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand VARCHAR(100) NOT NULL,
  item VARCHAR(200) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('sampling', 'production', 'shipping', 'completed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  quantity INTEGER DEFAULT 0,
  due_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jarvis 대화 로그 (AI 비서 히스토리)
CREATE TABLE IF NOT EXISTS panopticon_jarvis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  answer TEXT,
  query_category VARCHAR(50),
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 대시보드 설정
CREATE TABLE IF NOT EXISTS panopticon_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_financial_recorded_at ON panopticon_financial(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_musinsa_ranking_recorded_at ON panopticon_musinsa_ranking(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_musinsa_sales_recorded_at ON panopticon_musinsa_sales(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_cs_reports_recorded_at ON panopticon_cs_reports(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_server_status_recorded_at ON panopticon_server_status(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_active ON panopticon_production(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jarvis_logs_created_at ON panopticon_jarvis_logs(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE panopticon_financial ENABLE ROW LEVEL SECURITY;
ALTER TABLE panopticon_musinsa_ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE panopticon_musinsa_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE panopticon_cs_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE panopticon_server_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE panopticon_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE panopticon_jarvis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE panopticon_settings ENABLE ROW LEVEL SECURITY;

-- 기본 정책: 인증된 사용자만 읽기 가능 (CEO 대시보드이므로)
CREATE POLICY "panopticon_financial_read" ON panopticon_financial FOR SELECT USING (true);
CREATE POLICY "panopticon_musinsa_ranking_read" ON panopticon_musinsa_ranking FOR SELECT USING (true);
CREATE POLICY "panopticon_musinsa_sales_read" ON panopticon_musinsa_sales FOR SELECT USING (true);
CREATE POLICY "panopticon_cs_reports_read" ON panopticon_cs_reports FOR SELECT USING (true);
CREATE POLICY "panopticon_server_status_read" ON panopticon_server_status FOR SELECT USING (true);
CREATE POLICY "panopticon_production_read" ON panopticon_production FOR SELECT USING (true);
CREATE POLICY "panopticon_jarvis_logs_read" ON panopticon_jarvis_logs FOR SELECT USING (true);
CREATE POLICY "panopticon_settings_read" ON panopticon_settings FOR SELECT USING (true);

-- Service Role은 모든 작업 허용 (서버에서 데이터 수집 시)
CREATE POLICY "panopticon_financial_service" ON panopticon_financial FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "panopticon_musinsa_ranking_service" ON panopticon_musinsa_ranking FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "panopticon_musinsa_sales_service" ON panopticon_musinsa_sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "panopticon_cs_reports_service" ON panopticon_cs_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "panopticon_server_status_service" ON panopticon_server_status FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "panopticon_production_service" ON panopticon_production FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "panopticon_jarvis_logs_service" ON panopticon_jarvis_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "panopticon_settings_service" ON panopticon_settings FOR ALL USING (true) WITH CHECK (true);

-- 초기 생산 데이터 삽입
INSERT INTO panopticon_production (brand, item, status, progress, quantity, due_date, notes)
VALUES
  ('Aura Sydney', 'S/S 컬렉션', 'sampling', 80, 500, CURRENT_DATE + INTERVAL '45 days', '샘플링 80% 완료'),
  ('Filluminate', '24FW 리오더', 'shipping', 95, 1200, CURRENT_DATE + INTERVAL '7 days', '공장 출고 대기')
ON CONFLICT DO NOTHING;

-- 초기 설정 삽입
INSERT INTO panopticon_settings (key, value)
VALUES
  ('dashboard_refresh_interval', '30000'),
  ('jarvis_enabled', 'true'),
  ('notification_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
