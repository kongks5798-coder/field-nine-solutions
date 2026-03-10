CREATE TABLE IF NOT EXISTS app_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_slug TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_comments_slug ON app_comments(app_slug, created_at DESC);

ALTER TABLE app_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON app_comments FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON app_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own delete" ON app_comments FOR DELETE USING (auth.uid() = user_id);
