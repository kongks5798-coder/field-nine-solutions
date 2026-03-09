-- Generation history: stores user's AI generation prompts for reuse
CREATE TABLE IF NOT EXISTS public.generation_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt      TEXT NOT NULL,
  app_name    TEXT,
  model_id    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
  ON public.generation_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create history"
  ON public.generation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history"
  ON public.generation_history FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gen_history_user ON public.generation_history(user_id, created_at DESC);
