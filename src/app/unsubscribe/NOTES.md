Supabase migration needed:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_preferences jsonb DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_profiles_email_prefs ON profiles USING gin(email_preferences);
