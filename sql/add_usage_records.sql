-- Add token tracking columns to usage_records table
-- Run manually in Supabase SQL editor

-- 1. Add tokens_used column to existing usage_records table (nullable for backward compat)
ALTER TABLE usage_records
  ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT NULL;

-- 2. Add index for efficient monthly token queries per user
CREATE INDEX IF NOT EXISTS idx_usage_records_user_month
  ON usage_records(user_id, created_at);

-- 3. Add plan column to profiles if not already present
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- 4. (Optional) Backfill: if you prefer a separate table for token records only,
--    this creates a standalone usage_records table (skip if already exists above).
CREATE TABLE IF NOT EXISTS usage_records (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type           TEXT        NOT NULL DEFAULT 'token_usage',
  tokens_used    INTEGER     DEFAULT NULL,
  model          TEXT,
  quantity       INTEGER     NOT NULL DEFAULT 0,
  unit_price     INTEGER     NOT NULL DEFAULT 0,
  amount         INTEGER     NOT NULL DEFAULT 0,
  billed         BOOLEAN     NOT NULL DEFAULT FALSE,
  billing_period TEXT,
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_records_user_month_v2
  ON usage_records(user_id, created_at);
