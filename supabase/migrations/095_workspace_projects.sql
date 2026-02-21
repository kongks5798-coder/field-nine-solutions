-- ============================================================
-- Migration 095: workspace_projects
-- Separate from the legacy "projects" table (which has different schema).
-- This table stores FieldNine workspace projects (files, AI-generated code).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workspace_projects (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL DEFAULT '새 프로젝트',
  files       JSONB       NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workspace_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_projects_owner" ON public.workspace_projects;
CREATE POLICY "workspace_projects_owner" ON public.workspace_projects
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS workspace_projects_user_updated
  ON public.workspace_projects(user_id, updated_at DESC);
