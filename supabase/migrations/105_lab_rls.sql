-- ============================================================
-- Dalkak Dev Lab — Row Level Security
-- ============================================================

-- Enable RLS on all lab tables
ALTER TABLE lab_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_innovations ENABLE ROW LEVEL SECURITY;

-- Read policies: authenticated users can read all lab data
CREATE POLICY "lab_tournaments_read" ON lab_tournaments FOR SELECT TO authenticated USING (true);
CREATE POLICY "lab_teams_read" ON lab_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "lab_matches_read" ON lab_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "lab_innovations_read" ON lab_innovations FOR SELECT TO authenticated USING (true);

-- Write policies: only service_role (admin) can write
-- (No user-facing write policies needed since API uses admin client)
