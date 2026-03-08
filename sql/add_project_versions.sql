CREATE TABLE IF NOT EXISTS project_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  files JSONB NOT NULL DEFAULT '{}',
  file_count INTEGER DEFAULT 0,
  size_bytes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_versions_project ON project_versions(project_id, user_id, created_at DESC);

ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own versions" ON project_versions FOR ALL USING (user_id = auth.uid());
