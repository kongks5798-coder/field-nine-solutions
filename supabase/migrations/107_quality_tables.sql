-- Quality & Admin monitoring tables
-- v107: chat_logs, ai_quality_evals, ai_quality_alerts,
--       quality_backups, quality_settings, quality_settings_history, admin_alert_logs

-- 1. chat_logs
CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  model TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_logs_user ON chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created ON chat_logs(created_at DESC);
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_chat_logs ON chat_logs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 2. ai_quality_evals
CREATE TABLE IF NOT EXISTS ai_quality_evals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  score NUMERIC NOT NULL DEFAULT 0,
  prompt TEXT NOT NULL DEFAULT '',
  response TEXT NOT NULL DEFAULT '',
  expected TEXT,
  feedback TEXT,
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_quality_evals_model ON ai_quality_evals(model);
CREATE INDEX IF NOT EXISTS idx_ai_quality_evals_created ON ai_quality_evals(created_at DESC);
ALTER TABLE ai_quality_evals ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_ai_quality_evals ON ai_quality_evals FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 3. ai_quality_alerts
CREATE TABLE IF NOT EXISTS ai_quality_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL DEFAULT '',
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_quality_alerts_level ON ai_quality_alerts(level);
CREATE INDEX IF NOT EXISTS idx_ai_quality_alerts_created ON ai_quality_alerts(created_at DESC);
ALTER TABLE ai_quality_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_ai_quality_alerts ON ai_quality_alerts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. quality_backups
CREATE TABLE IF NOT EXISTS quality_backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  size_bytes BIGINT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quality_backups_created ON quality_backups(created_at DESC);
ALTER TABLE quality_backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_quality_backups ON quality_backups FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 5. quality_settings
CREATE TABLE IF NOT EXISTS quality_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quality_settings_key ON quality_settings(key);
ALTER TABLE quality_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_quality_settings ON quality_settings FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 6. quality_settings_history
CREATE TABLE IF NOT EXISTS quality_settings_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quality_settings_history_key ON quality_settings_history(setting_key);
CREATE INDEX IF NOT EXISTS idx_quality_settings_history_created ON quality_settings_history(created_at DESC);
ALTER TABLE quality_settings_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_quality_settings_history ON quality_settings_history FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 7. admin_alert_logs
CREATE TABLE IF NOT EXISTS admin_alert_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'info',
  severity TEXT NOT NULL DEFAULT 'low',
  message TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_alert_logs_type ON admin_alert_logs(type);
CREATE INDEX IF NOT EXISTS idx_admin_alert_logs_severity ON admin_alert_logs(severity);
CREATE INDEX IF NOT EXISTS idx_admin_alert_logs_created ON admin_alert_logs(created_at DESC);
ALTER TABLE admin_alert_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_admin_alert_logs ON admin_alert_logs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
