-- 097_collab_docs.sql
-- Realtime collab document store for the Dalkak Collab editor

CREATE TABLE IF NOT EXISTS collab_docs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT        UNIQUE NOT NULL,
  title      TEXT        NOT NULL DEFAULT 'Untitled',
  content    TEXT        DEFAULT '',
  owner_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collab_docs_slug ON collab_docs(slug);

ALTER TABLE collab_docs ENABLE ROW LEVEL SECURITY;

-- Anyone can read collab docs (public rooms)
CREATE POLICY "Public read collab docs"
  ON collab_docs FOR SELECT
  USING (true);

-- Only authenticated users can write (insert/update/delete)
CREATE POLICY "Auth write collab docs"
  ON collab_docs FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Auto-update updated_at on every write
CREATE OR REPLACE FUNCTION update_collab_docs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_collab_docs_updated_at ON collab_docs;
CREATE TRIGGER trg_collab_docs_updated_at
  BEFORE UPDATE ON collab_docs
  FOR EACH ROW EXECUTE FUNCTION update_collab_docs_updated_at();
