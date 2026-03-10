-- 114_collections.sql
-- Collections: users can group published apps into a portfolio collection

CREATE TABLE IF NOT EXISTS collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description TEXT CHECK (char_length(description) <= 500),
  is_public   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_apps (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  app_slug      TEXT NOT NULL,
  position      INTEGER DEFAULT 0,
  PRIMARY KEY (collection_id, app_slug)
);

-- RLS: collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read public collections"
  ON collections FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Owner write"
  ON collections FOR ALL
  USING (auth.uid() = user_id);

-- RLS: collection_apps
ALTER TABLE collection_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read via collection"
  ON collection_apps FOR SELECT
  USING (true);

CREATE POLICY "Owner write"
  ON collection_apps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE id = collection_id AND user_id = auth.uid()
    )
  );

-- Indexes for common access patterns
CREATE INDEX IF NOT EXISTS idx_collections_user_id    ON collections (user_id);
CREATE INDEX IF NOT EXISTS idx_collection_apps_col_id ON collection_apps (collection_id);
