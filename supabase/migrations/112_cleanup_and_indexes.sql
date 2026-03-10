-- published_apps 테이블 성능 인덱스 (있으면 스킵)
CREATE INDEX IF NOT EXISTS idx_published_apps_user_views ON published_apps(user_id, views DESC);
CREATE INDEX IF NOT EXISTS idx_published_apps_created ON published_apps(created_at DESC);

-- generation_history 인덱스 (이미 110에 있으면 스킵)
CREATE INDEX IF NOT EXISTS idx_gen_history_user_created ON generation_history(user_id, created_at DESC);
