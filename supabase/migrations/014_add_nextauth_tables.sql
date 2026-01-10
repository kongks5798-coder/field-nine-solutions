-- NextAuth.js 테이블 생성
-- Prisma를 사용하므로 이 마이그레이션은 참고용

-- Users 테이블
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts 테이블 (OAuth 제공자 정보)
CREATE TABLE IF NOT EXISTS public.accounts (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, "providerAccountId")
);

-- Sessions 테이블
CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY,
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

-- VerificationTokens 테이블
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  UNIQUE(identifier, token)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON public.sessions("sessionToken");

-- RLS 정책 (선택사항 - Supabase 사용 시)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid()::text = id);
