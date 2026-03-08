-- Gallery enhancement: comments table + fork tracking
-- Run this in your Supabase SQL editor

-- 1. Comments table
CREATE TABLE IF NOT EXISTS app_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_comments_slug ON app_comments(slug, created_at DESC);

ALTER TABLE app_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments"
  ON app_comments FOR SELECT USING (true);

CREATE POLICY "Logged in users can comment"
  ON app_comments FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON app_comments FOR DELETE USING (user_id = auth.uid());

-- 2. Add forks column to published_apps (if not exists)
ALTER TABLE published_apps ADD COLUMN IF NOT EXISTS forks INTEGER DEFAULT 0;

-- 3. Add forked_from column to projects (tracks which published slug was forked)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS forked_from TEXT;

-- 4. RPC: increment_forks
CREATE OR REPLACE FUNCTION increment_forks(slug_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE published_apps
  SET forks = COALESCE(forks, 0) + 1
  WHERE slug = slug_param;
END;
$$;

-- 5. RPC: increment_app_likes (already referenced by like route — ensure it exists)
CREATE OR REPLACE FUNCTION increment_app_likes(p_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE published_apps
  SET likes = COALESCE(likes, 0) + 1
  WHERE slug = p_slug;
END;
$$;
