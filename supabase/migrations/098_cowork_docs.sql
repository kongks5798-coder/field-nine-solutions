-- 098_cowork_docs.sql
-- 코워크 문서 영구 저장 테이블

CREATE TABLE IF NOT EXISTS cowork_docs (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT        NOT NULL DEFAULT '새 문서',
  emoji       TEXT        NOT NULL DEFAULT '📄',
  content     TEXT        NOT NULL DEFAULT '',
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  is_shared   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cowork_docs_user       ON cowork_docs(user_id);
CREATE INDEX IF NOT EXISTS idx_cowork_docs_updated    ON cowork_docs(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cowork_docs_shared     ON cowork_docs(is_shared) WHERE is_shared = true;

ALTER TABLE cowork_docs ENABLE ROW LEVEL SECURITY;

-- 본인 문서 전체 CRUD
CREATE POLICY "cowork: owner full access"
  ON cowork_docs FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 공유 문서는 로그인한 모든 유저가 읽기 가능
CREATE POLICY "cowork: shared docs readable"
  ON cowork_docs FOR SELECT
  USING (is_shared = true AND auth.uid() IS NOT NULL);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_cowork_docs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cowork_docs_updated_at ON cowork_docs;
CREATE TRIGGER trg_cowork_docs_updated_at
  BEFORE UPDATE ON cowork_docs
  FOR EACH ROW EXECUTE FUNCTION update_cowork_docs_updated_at();
