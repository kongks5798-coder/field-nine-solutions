-- Custom domains table for published apps
CREATE TABLE IF NOT EXISTS public.domains (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain      TEXT NOT NULL,
  project_id  TEXT,
  project_name TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','error')),
  cname_value TEXT NOT NULL DEFAULT 'cname.fieldnine.io',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Domain must be unique globally
CREATE UNIQUE INDEX IF NOT EXISTS domains_domain_unique ON public.domains(LOWER(domain));

-- Per-user limit index
CREATE INDEX IF NOT EXISTS domains_user_id ON public.domains(user_id, created_at DESC);

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON public.domains
  FOR ALL USING (auth.uid() = user_id);
