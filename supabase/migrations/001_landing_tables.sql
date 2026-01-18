-- K-Universal Landing Page Tables
-- Run this in Supabase SQL Editor

-- 1. Early Access (사전등록) 테이블
CREATE TABLE IF NOT EXISTS early_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  platform TEXT DEFAULT 'both', -- 'ios', 'android', 'both'
  locale TEXT DEFAULT 'ko',
  source TEXT DEFAULT 'landing', -- 'landing', 'popup', 'footer'
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ -- 알림 발송 시점
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_early_access_email ON early_access(email);
CREATE INDEX IF NOT EXISTS idx_early_access_created ON early_access(created_at DESC);

-- RLS 활성화
ALTER TABLE early_access ENABLE ROW LEVEL SECURITY;

-- 누구나 삽입 가능 (사전등록)
CREATE POLICY "Anyone can insert early_access" ON early_access
  FOR INSERT WITH CHECK (true);

-- 읽기는 인증된 관리자만 (나중에 admin role 추가)
CREATE POLICY "Only admins can read early_access" ON early_access
  FOR SELECT USING (auth.role() = 'authenticated');


-- 2. Reviews (리뷰) 테이블
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  country TEXT DEFAULT 'KR', -- ISO 국가 코드
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  service TEXT DEFAULT 'general', -- 'esim', 'exchange', 'ai', 'general'
  locale TEXT DEFAULT 'ko',
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON reviews(is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_locale ON reviews(locale);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);

-- RLS 활성화
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (true);

-- 삽입/수정은 인증된 사용자만
CREATE POLICY "Authenticated users can insert reviews" ON reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 3. A/B Test Assignments (A/B 테스트) 테이블
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL, -- 브라우저 fingerprint 또는 cookie
  test_name TEXT NOT NULL,
  variant TEXT NOT NULL, -- 'A', 'B', 'C' 등
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  conversion_type TEXT, -- 'signup', 'early_access', 'click_cta'
  UNIQUE(visitor_id, test_name)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ab_tests_name ON ab_tests(test_name);
CREATE INDEX IF NOT EXISTS idx_ab_tests_variant ON ab_tests(test_name, variant);

-- RLS 활성화
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;

-- 누구나 삽입/업데이트 가능
CREATE POLICY "Anyone can insert ab_tests" ON ab_tests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update ab_tests" ON ab_tests
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can read ab_tests" ON ab_tests
  FOR SELECT USING (true);


-- 4. 초기 리뷰 데이터 삽입 (한국어)
INSERT INTO reviews (name, country, rating, comment, service, locale, is_featured, is_verified) VALUES
  ('김지현', 'KR', 5, '일본 여행 갔을 때 eSIM으로 데이터 걱정 없이 다녔어요. 공항에서 바로 활성화되고 속도도 빨라서 만족!', 'esim', 'ko', true, true),
  ('박민수', 'KR', 5, '환율 알림 기능 덕분에 가장 좋은 타이밍에 환전했어요. 10만원 정도 아꼈습니다.', 'exchange', 'ko', true, true),
  ('이수진', 'KR', 4, 'AI 번역이 생각보다 정확해서 놀랐어요. 현지인이랑 대화할 때 많이 도움됐습니다.', 'ai', 'ko', true, true),
  ('최영호', 'KR', 5, '태국 여행 2주 동안 무제한 데이터 쓰고 50% 절약했어요. 다음에도 무조건 쓸 예정!', 'esim', 'ko', true, true),
  ('정하나', 'KR', 5, '베트남에서 그랩 대신 현지 택시 앱 쓸 때 실시간 번역으로 기사님이랑 소통했어요. 완전 편함!', 'ai', 'ko', true, true),
  ('강동현', 'KR', 4, '유럽 5개국 여행하면서 하나의 eSIM으로 해결. 국가 이동할 때마다 자동 연결되니 너무 좋아요.', 'esim', 'ko', false, true)
ON CONFLICT DO NOTHING;

-- 5. 초기 리뷰 데이터 삽입 (영어)
INSERT INTO reviews (name, country, rating, comment, service, locale, is_featured, is_verified) VALUES
  ('Mike Johnson', 'US', 5, 'Best eSIM experience in Korea! Activated instantly at Incheon and had 5G speeds everywhere.', 'esim', 'en', true, true),
  ('Sarah Chen', 'CA', 5, 'The exchange rate alerts saved me so much money. Got KRW at the perfect rate!', 'exchange', 'en', true, true),
  ('James Williams', 'GB', 4, 'AI translation helped me order food at local restaurants. Game changer for solo travelers.', 'ai', 'en', true, true),
  ('Emma Martinez', 'AU', 5, 'Used it for my 3-week Korea trip. Unlimited data + AI assistant = perfect combo!', 'esim', 'en', true, true),
  ('David Lee', 'SG', 5, 'Finally an app that understands what tourists actually need. The AI recommendations were spot-on.', 'ai', 'en', true, true),
  ('Lisa Park', 'US', 4, 'Coming back to Korea after 10 years. This app made everything so much easier than before.', 'general', 'en', false, true)
ON CONFLICT DO NOTHING;
