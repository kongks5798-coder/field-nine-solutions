-- 상품 추천 테이블
-- AI가 생성한 추천 아이템 저장

CREATE TABLE IF NOT EXISTS product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 상품 정보
  product_name TEXT NOT NULL,
  product_url TEXT,
  product_image_url TEXT,
  brand TEXT,
  category TEXT,
  
  -- 가격 정보
  current_price INTEGER NOT NULL, -- 현재 가격 (원)
  original_price INTEGER, -- 원래 가격
  discount_percentage INTEGER, -- 할인율 (%)
  predicted_price_drop INTEGER, -- 예상 가격 하락 (원)
  predicted_drop_date DATE, -- 예상 가격 하락 날짜
  
  -- 추천 이유
  recommendation_reason TEXT, -- AI가 생성한 추천 이유
  ai_confidence DECIMAL(3,2) DEFAULT 0.80, -- AI 신뢰도 (0-1)
  
  -- 데이터 소스 (Hallucination 방지)
  data_sources JSONB DEFAULT '[]', -- 데이터 소스 배열 (예: ["11번가", "쿠팡", "가격 예측 모델"])
  price_history JSONB DEFAULT '[]', -- 가격 이력
  
  -- 상태
  status TEXT DEFAULT 'pending', -- pending, viewed, purchased, dismissed
  viewed_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ,
  
  -- 통계
  estimated_savings INTEGER DEFAULT 0, -- 예상 절약 금액
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_product_recommendations_user_id ON product_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_status ON product_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_created_at ON product_recommendations(created_at DESC);

-- RLS 정책
ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendations"
  ON product_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON product_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendations"
  ON product_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 업데이트 시간 자동 갱신
CREATE TRIGGER update_product_recommendations_updated_at
  BEFORE UPDATE ON product_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();
