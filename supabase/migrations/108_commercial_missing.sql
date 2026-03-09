-- 108: Commercial missing tables
-- quality_scores, webhook_events, profiles.email_preferences

-- 1. quality_scores (pipeline quality tracking)
CREATE TABLE IF NOT EXISTS quality_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  app_name text NOT NULL DEFAULT '새 앱',
  score integer NOT NULL CHECK(score >= 0 AND score <= 100),
  issues_count integer NOT NULL DEFAULT 0,
  pipeline_type text NOT NULL DEFAULT 'team',
  platform text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quality_scores_user ON quality_scores(user_id, created_at DESC);
ALTER TABLE quality_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own scores" ON quality_scores FOR ALL USING (auth.uid() = user_id);

-- 2. webhook_events (Toss idempotency)
CREATE TABLE IF NOT EXISTS webhook_events (
  id text PRIMARY KEY,
  processed_at timestamptz DEFAULT now()
);
-- Auto-cleanup old events (keep 30 days)
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed_at);

-- 3. profiles.email_preferences column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_preferences jsonb DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_profiles_email_prefs ON profiles USING gin(email_preferences);

-- 4. workspace_memory (AI style memory)
CREATE TABLE IF NOT EXISTS workspace_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  tags text[] DEFAULT '{}',
  html_preview text,
  style_tokens jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workspace_memory_user ON workspace_memory(user_id, created_at DESC);
ALTER TABLE workspace_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own memory" ON workspace_memory FOR ALL USING (auth.uid() = user_id);
