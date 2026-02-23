-- Enterprise Schema for Dalkak Boss Dashboard, RBAC, AI Hub, Delegation, Hybrid Cloud
-- v1: Hierarchical Dashboard tables
CREATE TABLE IF NOT EXISTS employee_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department TEXT NOT NULL DEFAULT 'general',
  action_type TEXT NOT NULL, -- 'build', 'deploy', 'ai_query', 'file_upload', 'collab_edit'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_emp_activity_user ON employee_activity(user_id);
CREATE INDEX idx_emp_activity_dept ON employee_activity(department);
CREATE INDEX idx_emp_activity_created ON employee_activity(created_at DESC);

-- v2: RBAC System
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- 'owner', 'admin', 'manager', 'developer', 'viewer'
  permissions JSONB NOT NULL DEFAULT '[]', -- ['read', 'write', 'deploy', 'admin', 'billing']
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  org_id UUID, -- null = global role
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role_id, org_id)
);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- v3: AI Tool Usage (for AI Data Hub)
CREATE TABLE IF NOT EXISTS ai_tool_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department TEXT NOT NULL DEFAULT 'general',
  tool_name TEXT NOT NULL, -- 'gpt-4o', 'claude-3', 'gemini', 'grok'
  tokens_used INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  request_type TEXT DEFAULT 'chat', -- 'chat', 'code_gen', 'review', 'translate'
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ai_usage_dept ON ai_tool_usage(department);
CREATE INDEX idx_ai_usage_tool ON ai_tool_usage(tool_name);
CREATE INDEX idx_ai_usage_created ON ai_tool_usage(created_at DESC);

-- v4: Sub-Admin Delegation
CREATE TABLE IF NOT EXISTS sub_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '["read"]',
  delegated_by UUID NOT NULL REFERENCES auth.users(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, department)
);
CREATE INDEX idx_sub_admins_dept ON sub_admins(department);

-- v5: Edge Sync Log (Hybrid Cloud)
CREATE TABLE IF NOT EXISTS edge_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  edge_node_id TEXT NOT NULL,
  sync_direction TEXT NOT NULL DEFAULT 'push', -- 'push', 'pull'
  table_name TEXT NOT NULL,
  records_synced INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'completed', 'failed'
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_edge_sync_node ON edge_sync_log(edge_node_id);
CREATE INDEX idx_edge_sync_status ON edge_sync_log(status);

-- RLS Policies
ALTER TABLE employee_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_sync_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all
CREATE POLICY admin_read_emp_activity ON employee_activity FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name IN ('owner','admin'))
);
CREATE POLICY own_read_emp_activity ON employee_activity FOR SELECT USING (user_id = auth.uid());
CREATE POLICY insert_emp_activity ON employee_activity FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY admin_read_roles ON roles FOR SELECT USING (true);
CREATE POLICY admin_manage_roles ON roles FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'owner')
);

CREATE POLICY admin_read_user_roles ON user_roles FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name IN ('owner','admin'))
);

CREATE POLICY admin_read_ai_usage ON ai_tool_usage FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name IN ('owner','admin'))
);
CREATE POLICY insert_ai_usage ON ai_tool_usage FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY admin_read_sub_admins ON sub_admins FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name IN ('owner','admin'))
);

CREATE POLICY admin_read_edge_sync ON edge_sync_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name IN ('owner','admin'))
);

-- Seed default roles
INSERT INTO roles (name, permissions, description) VALUES
  ('owner', '["read","write","deploy","admin","billing","delegate"]', '조직 소유자 — 모든 권한'),
  ('admin', '["read","write","deploy","admin"]', '관리자 — 빌링 제외 전체 권한'),
  ('manager', '["read","write","deploy"]', '매니저 — 빌드+배포 가능'),
  ('developer', '["read","write"]', '개발자 — 읽기+쓰기'),
  ('viewer', '["read"]', '뷰어 — 읽기 전용')
ON CONFLICT (name) DO NOTHING;
