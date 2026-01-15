-- ============================================
-- Panopticon CEO Dashboard Schema (Simplified)
-- 테이블만 먼저 생성
-- ============================================

-- 1. 재무 데이터
CREATE TABLE panopticon_financial (
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
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 무신사 랭킹
CREATE TABLE panopticon_musinsa_ranking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_rank INTEGER NOT NULL,
  category_rank INTEGER NOT NULL,
  category VARCHAR(100) DEFAULT '아우터',
  previous_rank INTEGER,
  change_direction VARCHAR(10),
  change_amount INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 무신사 매출
CREATE TABLE panopticon_musinsa_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_sales BIGINT DEFAULT 0,
  today_sales BIGINT DEFAULT 0,
  week_sales BIGINT DEFAULT 0,
  month_sales BIGINT DEFAULT 0,
  settlement_amount BIGINT DEFAULT 0,
  pending_settlement BIGINT DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CS 리포트
CREATE TABLE panopticon_cs_reports (
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
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 서버 상태
CREATE TABLE panopticon_server_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_name VARCHAR(100) DEFAULT 'RTX 5090 Server',
  status VARCHAR(20) DEFAULT 'online',
  cpu_usage DECIMAL(5,2) DEFAULT 0,
  memory_usage DECIMAL(5,2) DEFAULT 0,
  gpu_usage DECIMAL(5,2),
  temperature DECIMAL(5,2),
  uptime_seconds BIGINT DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 생산 현황
CREATE TABLE panopticon_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand VARCHAR(100) NOT NULL,
  item VARCHAR(200) NOT NULL,
  status VARCHAR(20),
  progress INTEGER DEFAULT 0,
  quantity INTEGER DEFAULT 0,
  due_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Jarvis 로그
CREATE TABLE panopticon_jarvis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  answer TEXT,
  query_category VARCHAR(50),
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 설정
CREATE TABLE panopticon_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 데이터
INSERT INTO panopticon_production (brand, item, status, progress, quantity, due_date, notes)
VALUES
  ('Aura Sydney', 'S/S 컬렉션', 'sampling', 80, 500, CURRENT_DATE + 45, '샘플링 80% 완료'),
  ('Filluminate', '24FW 리오더', 'shipping', 95, 1200, CURRENT_DATE + 7, '공장 출고 대기');

INSERT INTO panopticon_settings (key, value)
VALUES
  ('dashboard_refresh_interval', '"30000"'),
  ('jarvis_enabled', '"true"'),
  ('notification_enabled', '"true"');
