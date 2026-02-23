-- ============================================================
-- Dalkak Dev Lab — AI 에이전트 토너먼트 스키마
-- ============================================================

-- 토너먼트
CREATE TABLE IF NOT EXISTS lab_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','play_in','round_8','semi','final','completed')),
  champion_team_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 팀 (토너먼트당 10팀, 3인1조)
CREATE TABLE IF NOT EXISTS lab_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES lab_tournaments(id) ON DELETE CASCADE,
  seed INT NOT NULL CHECK (seed BETWEEN 1 AND 10),
  agent_ids INT[] NOT NULL,
  team_name TEXT NOT NULL,
  eliminated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 매치
CREATE TABLE IF NOT EXISTS lab_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES lab_tournaments(id) ON DELETE CASCADE,
  round TEXT NOT NULL CHECK (round IN ('play_in','round_8','semi','final')),
  match_order INT NOT NULL,
  team_a_id UUID REFERENCES lab_teams(id),
  team_b_id UUID REFERENCES lab_teams(id),
  winner_id UUID REFERENCES lab_teams(id),
  score_a JSONB,
  score_b JSONB,
  reasoning TEXT,
  executed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 혁신 결과물
CREATE TABLE IF NOT EXISTS lab_innovations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES lab_tournaments(id) ON DELETE CASCADE,
  match_id UUID REFERENCES lab_matches(id),
  team_id UUID REFERENCES lab_teams(id),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  architecture TEXT,
  code_snippet TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  scores JSONB,
  round_reached TEXT NOT NULL CHECK (round_reached IN ('play_in','round_8','semi','final')),
  maturity INT NOT NULL DEFAULT 0 CHECK (maturity BETWEEN 0 AND 100),
  can_reenter BOOLEAN NOT NULL DEFAULT false,
  finalized BOOLEAN NOT NULL DEFAULT false,
  parent_id UUID REFERENCES lab_innovations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_lab_teams_tournament ON lab_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_lab_matches_tournament ON lab_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_lab_innovations_tournament ON lab_innovations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_lab_innovations_reenter ON lab_innovations(can_reenter) WHERE can_reenter = true AND finalized = false;
CREATE INDEX IF NOT EXISTS idx_lab_innovations_breakthrough ON lab_innovations(round_reached) WHERE round_reached IN ('semi','final');
