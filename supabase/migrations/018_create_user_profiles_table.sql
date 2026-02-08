-- 사용자 프로필 및 선호도 테이블
-- AI 퍼스널 쇼핑 어시스턴트용

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 기본 정보
  budget_min INTEGER DEFAULT 0, -- 최소 예산 (원)
  budget_max INTEGER DEFAULT 1000000, -- 최대 예산 (원)
  preferred_brands TEXT[], -- 선호 브랜드 배열
  preferred_categories TEXT[], -- 선호 카테고리 배열 (의류, 전자제품 등)
  
  -- 취향 설정
  style_preferences JSONB DEFAULT '{}', -- 스타일 선호도 (미니멀, 캐주얼 등)
  color_preferences TEXT[], -- 선호 색상
  size_preferences JSONB DEFAULT '{}', -- 사이즈 정보
  
  -- 알림 설정
  price_drop_threshold INTEGER DEFAULT 20, -- 가격 하락 알림 임계값 (%)
  notify_on_sale BOOLEAN DEFAULT true,
  notify_on_new_items BOOLEAN DEFAULT false,
  
  -- 통계
  total_recommendations INTEGER DEFAULT 0,
  total_savings INTEGER DEFAULT 0, -- 총 절약 금액 (원)
  favorite_items UUID[], -- 즐겨찾기 아이템 ID 배열
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- RLS 정책
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 업데이트 시간 자동 갱신
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();
