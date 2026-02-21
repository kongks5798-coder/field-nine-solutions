-- ============================================================
-- Migration 092: projects, user_tokens, published_apps
-- ============================================================

-- ── Projects ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL DEFAULT '새 프로젝트',
  files       JSONB       NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_owner" ON public.projects;
CREATE POLICY "projects_owner" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS projects_user_updated
  ON public.projects(user_id, updated_at DESC);

-- ── User Tokens ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_tokens (
  user_id     UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance     INTEGER     NOT NULL DEFAULT 50000,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tokens_owner" ON public.user_tokens;
CREATE POLICY "tokens_owner" ON public.user_tokens
  FOR ALL USING (auth.uid() = user_id);

-- ── Published Apps ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.published_apps (
  slug        TEXT        PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  TEXT,
  name        TEXT        NOT NULL,
  html        TEXT        NOT NULL,
  views       INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.published_apps ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public apps)
DROP POLICY IF EXISTS "apps_public_read" ON public.published_apps;
CREATE POLICY "apps_public_read" ON public.published_apps
  FOR SELECT USING (true);

-- Only owner can write
DROP POLICY IF EXISTS "apps_owner_write" ON public.published_apps;
CREATE POLICY "apps_owner_write" ON public.published_apps
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS published_apps_user
  ON public.published_apps(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS published_apps_views
  ON public.published_apps(views DESC);
