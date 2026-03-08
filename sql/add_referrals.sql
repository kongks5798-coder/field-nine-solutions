-- Referral System Migration
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  rewarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(referred_id)
);

-- Index for fast lookups by referrer
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON referrals(referrer_id);

-- RPC to add tokens to user_tokens table
CREATE OR REPLACE FUNCTION add_tokens(user_id UUID, amount INTEGER)
RETURNS void AS $$
BEGIN
  -- Upsert: create row if not exists, otherwise add amount
  INSERT INTO user_tokens (user_id, balance, updated_at)
    VALUES (user_id, amount, now())
  ON CONFLICT (user_id) DO UPDATE
    SET balance = GREATEST(0, user_tokens.balance + amount),
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
