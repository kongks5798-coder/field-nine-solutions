/**
 * Team Role-Based Access Control System
 */

export type TeamRole = "owner" | "admin" | "editor" | "viewer";

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: TeamRole;
  joinedAt: string;
  lastActiveAt: string;
}

export interface TeamProject {
  id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: string;
}

// Permission definitions
const ROLE_PERMISSIONS: Record<TeamRole, Set<string>> = {
  owner: new Set([
    "project:delete", "project:settings", "project:transfer",
    "member:invite", "member:remove", "member:changeRole",
    "file:create", "file:edit", "file:delete",
    "deploy:create", "deploy:rollback",
    "git:push", "git:branch", "git:merge",
    "ai:generate", "ai:autonomous",
    "secrets:manage",
  ]),
  admin: new Set([
    "member:invite", "member:remove",
    "file:create", "file:edit", "file:delete",
    "deploy:create", "deploy:rollback",
    "git:push", "git:branch", "git:merge",
    "ai:generate", "ai:autonomous",
    "secrets:manage",
  ]),
  editor: new Set([
    "file:create", "file:edit",
    "git:push", "git:branch",
    "ai:generate",
  ]),
  viewer: new Set([
    // Read-only: can view files, preview, and git history
  ]),
};

export function hasPermission(role: TeamRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function canChangeRole(actorRole: TeamRole, targetCurrentRole: TeamRole, targetNewRole: TeamRole): boolean {
  if (actorRole === "owner") return targetNewRole !== "owner";
  if (actorRole === "admin") return targetCurrentRole !== "owner" && targetNewRole !== "owner" && targetNewRole !== "admin";
  return false;
}

export function getRoleLabel(role: TeamRole): string {
  const labels: Record<TeamRole, string> = {
    owner: "\uC18C\uC720\uC790",
    admin: "\uAD00\uB9AC\uC790",
    editor: "\uD3B8\uC9D1\uC790",
    viewer: "\uBDF0\uC5B4",
  };
  return labels[role];
}

export function getRoleColor(role: TeamRole): string {
  const colors: Record<TeamRole, string> = {
    owner: "#f59e0b",
    admin: "#8b5cf6",
    editor: "#3b82f6",
    viewer: "#6b7280",
  };
  return colors[role];
}

export function getPermissionsForRole(role: TeamRole): string[] {
  return Array.from(ROLE_PERMISSIONS[role] || []);
}

// Storage helpers
const TEAM_STORAGE_KEY = "f9_team_v1";

export function loadTeamProject(): TeamProject | null {
  try {
    const raw = localStorage.getItem(TEAM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTeamProject(project: TeamProject): void {
  try {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(project));
  } catch { /* ignore */ }
}

export function createTeamProject(name: string, owner: Omit<TeamMember, "role" | "joinedAt" | "lastActiveAt">): TeamProject {
  const now = new Date().toISOString();
  const project: TeamProject = {
    id: `team_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    ownerId: owner.id,
    members: [{
      ...owner,
      role: "owner",
      joinedAt: now,
      lastActiveAt: now,
    }],
    createdAt: now,
  };
  saveTeamProject(project);
  return project;
}

export function addTeamMember(project: TeamProject, member: Omit<TeamMember, "joinedAt" | "lastActiveAt">, actorRole: TeamRole): TeamProject | null {
  if (!hasPermission(actorRole, "member:invite")) return null;
  if (project.members.some(m => m.id === member.id)) return null;

  const now = new Date().toISOString();
  const updated = {
    ...project,
    members: [...project.members, { ...member, joinedAt: now, lastActiveAt: now }],
  };
  saveTeamProject(updated);
  return updated;
}

export function removeTeamMember(project: TeamProject, memberId: string, actorRole: TeamRole): TeamProject | null {
  if (!hasPermission(actorRole, "member:remove")) return null;
  const member = project.members.find(m => m.id === memberId);
  if (!member || member.role === "owner") return null;

  const updated = {
    ...project,
    members: project.members.filter(m => m.id !== memberId),
  };
  saveTeamProject(updated);
  return updated;
}

export function changeRole(project: TeamProject, memberId: string, newRole: TeamRole, actorRole: TeamRole): TeamProject | null {
  const member = project.members.find(m => m.id === memberId);
  if (!member) return null;
  if (!canChangeRole(actorRole, member.role, newRole)) return null;

  const updated = {
    ...project,
    members: project.members.map(m => m.id === memberId ? { ...m, role: newRole } : m),
  };
  saveTeamProject(updated);
  return updated;
}
