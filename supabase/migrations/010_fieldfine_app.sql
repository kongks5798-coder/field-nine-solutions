-- ============================================================
-- FieldNine App Tables
-- Run this in Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → paste → Run
-- ============================================================

-- ── 0. Enable realtime for relevant tables ─────────────────
-- (Run after table creation)

-- ── 1. Profiles (extends auth.users) ──────────────────────
-- Add display name column if it doesn't exist in existing profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Public profiles are viewable" ON public.profiles
      FOR SELECT USING (true);

    CREATE POLICY "Users can insert own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);

    CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. Messages (team chat realtime) ──────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id BIGSERIAL PRIMARY KEY,
  channel TEXT NOT NULL DEFAULT 'general',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user TEXT NOT NULL,  -- display name, denormalized for speed
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for channel queries
CREATE INDEX IF NOT EXISTS idx_messages_channel_created
  ON public.messages (channel, created_at ASC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Anyone logged in (or anon with anon key) can read
CREATE POLICY "Anyone can read messages" ON public.messages
  FOR SELECT USING (true);

-- Anyone can insert (user_name validated client-side)
CREATE POLICY "Anyone can insert messages" ON public.messages
  FOR INSERT WITH CHECK (true);

-- Only message owner can delete
CREATE POLICY "Owner can delete message" ON public.messages
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ── 3. Documents (CoWork) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '새 문서',
  emoji TEXT NOT NULL DEFAULT '📝',
  content TEXT NOT NULL DEFAULT '',
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_shared BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_owner
  ON public.documents (owner_id, updated_at DESC);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Shared docs visible to all authenticated users
CREATE POLICY "Authenticated users can read shared docs" ON public.documents
  FOR SELECT USING (is_shared = true OR auth.uid() = owner_id);

CREATE POLICY "Authenticated users can insert docs" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update doc" ON public.documents
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owner can delete doc" ON public.documents
  FOR DELETE USING (auth.uid() = owner_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed default documents
INSERT INTO public.documents (title, emoji, content, owner_id, is_shared)
VALUES
  ('FieldNine 제품 로드맵', '🗺️',
   E'# FieldNine 제품 로드맵\n\n## 2026년 1분기 목표\n\n- [ ] AI 코드 생성 기능 출시\n- [ ] 팀 협업 채팅 고도화\n- [ ] 클라우드 스토리지 100GB 지원\n- [ ] 모바일 반응형 완성\n\n## 기술 스택\n\n- **프론트엔드**: Next.js 16, React 18\n- **백엔드**: Next.js API Routes, Supabase\n- **AI**: OpenAI GPT-4, Anthropic Claude, Google Gemini',
   NULL, true),
  ('팀 규칙 & 문화', '🌱',
   E'# 팀 규칙 & 문화\n\n## 핵심 가치\n\n1. **신속함** — 빠르게 만들고, 빠르게 배운다\n2. **투명함** — 모든 결정을 문서로 남긴다\n3. **배려** — 동료의 시간을 존중한다\n\n## 미팅 원칙\n\n- 모든 미팅은 어젠다 먼저\n- 결정사항은 즉시 문서화\n- 15분 초과 시 다음 미팅으로',
   NULL, true)
ON CONFLICT DO NOTHING;

-- ── 4. File Metadata (Cloud storage) ──────────────────────
CREATE TABLE IF NOT EXISTS public.file_metadata (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  size BIGINT DEFAULT 0,
  mime_type TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  folder TEXT DEFAULT '/',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_metadata_owner
  ON public.file_metadata (owner_id, created_at DESC);

ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read own files" ON public.file_metadata
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Owner can insert files" ON public.file_metadata
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can delete files" ON public.file_metadata
  FOR DELETE USING (auth.uid() = owner_id);

-- ── 5. Storage Bucket ─────────────────────────────────────
-- NOTE: Run this separately in SQL Editor if needed
-- Supabase creates storage buckets via the Dashboard or this SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files', 'files', false,
  104857600,  -- 100 MB limit per file
  NULL        -- allow all mime types
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can manage their own files (path: {user_id}/filename)
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'files' AND (storage.foldername(name))[1] = auth.uid()::text);
