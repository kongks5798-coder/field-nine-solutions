-- 115_community_snippets.sql
-- Community snippet library: user-submitted, admin-approved code snippets

CREATE TABLE IF NOT EXISTS community_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 3 AND 80),
  description TEXT CHECK (char_length(description) <= 200),
  language TEXT NOT NULL CHECK (language IN ('html','css','javascript','typescript')),
  category TEXT NOT NULL,
  code TEXT NOT NULL CHECK (char_length(code) BETWEEN 10 AND 5000),
  likes INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast approved-snippet queries by category
CREATE INDEX IF NOT EXISTS idx_community_snippets_approved_category
  ON community_snippets (is_approved, category)
  WHERE is_approved = true;

-- Index for fast approved-snippet queries (no filter)
CREATE INDEX IF NOT EXISTS idx_community_snippets_approved_created
  ON community_snippets (is_approved, created_at DESC)
  WHERE is_approved = true;

-- Only show approved snippets publicly
ALTER TABLE community_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved"
  ON community_snippets FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Auth insert"
  ON community_snippets FOR INSERT
  WITH CHECK (auth.uid() = user_id);
