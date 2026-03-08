-- Teams tables
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT DEFAULT 'team',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'editor',
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(team_id, email)
);

-- RLS policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view their teams" ON teams
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = id AND user_id = auth.uid())
  );
CREATE POLICY "Team owners can insert teams" ON teams FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Team owners can delete teams" ON teams FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Members can view team members" ON team_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = team_id AND tm.user_id = auth.uid())
  );
CREATE POLICY "Anyone can insert themselves" ON team_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners can manage members" ON team_members FOR ALL USING (
  EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = team_id AND tm.user_id = auth.uid() AND tm.role = 'owner')
);
