import { create } from "zustand";
import type { Project } from "../workspace.constants";
import { PROJ_KEY, CUR_KEY, DEFAULT_FILES } from "../workspace.constants";
import { useFileSystemStore } from "./useFileSystemStore";

function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(PROJ_KEY) ?? "[]"); } catch { return []; }
}

function saveProjectToStorage(p: Project) {
  if (typeof window === "undefined") return;
  const all = loadProjects();
  const idx = all.findIndex((x) => x.id === p.id);
  if (idx >= 0) all[idx] = p; else all.unshift(p);
  localStorage.setItem(PROJ_KEY, JSON.stringify(all.slice(0, 20)));
}

function genId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface ProjectState {
  projectId: string;
  projectName: string;
  projects: Project[];
  showProjects: boolean;
  confirmDeleteProj: Project | null;

  setProjectId: (id: string) => void;
  setProjectName: (name: string) => void;
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  setShowProjects: (v: boolean) => void;
  setConfirmDeleteProj: (p: Project | null) => void;

  loadProjectsFromStorage: () => void;
  saveProject: (p: Project) => void;
  newProject: () => { id: string; files: Record<string, unknown> };
  deleteProject: (proj: Project) => void;
  confirmDeleteProjectAction: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectId: typeof window !== "undefined" ? (localStorage.getItem(CUR_KEY) || genId()) : genId(),
  projectName: "내 프로젝트",
  projects: [],
  showProjects: false,
  confirmDeleteProj: null,

  setProjectId: (id) => set({ projectId: id }),
  setProjectName: (name) => set({ projectName: name }),
  setProjects: (arg) => set((s) => ({ projects: typeof arg === "function" ? arg(s.projects) : arg })),
  setShowProjects: (v) => set({ showProjects: v }),
  setConfirmDeleteProj: (p) => set({ confirmDeleteProj: p }),

  loadProjectsFromStorage: () => set({ projects: loadProjects() }),

  saveProject: (p) => {
    saveProjectToStorage(p);
    localStorage.setItem(CUR_KEY, p.id);
    set({ projects: loadProjects() });
  },

  newProject: () => {
    const id = genId();
    const f = { ...DEFAULT_FILES };
    saveProjectToStorage({ id, name: "새 프로젝트", files: f, updatedAt: new Date().toISOString() });
    localStorage.setItem(CUR_KEY, id);
    set({ projectId: id, projectName: "새 프로젝트", showProjects: false });
    // Sync file system store
    useFileSystemStore.getState().resetFiles(f);
    return { id, files: f };
  },

  deleteProject: (proj) => {
    set({ confirmDeleteProj: proj });
  },

  confirmDeleteProjectAction: () => {
    const { confirmDeleteProj, projectId } = get();
    if (!confirmDeleteProj) return;
    const all = loadProjects().filter((p) => p.id !== confirmDeleteProj.id);
    localStorage.setItem(PROJ_KEY, JSON.stringify(all));
    set({ projects: all, confirmDeleteProj: null });
    fetch(`/api/projects/${confirmDeleteProj.id}`, { method: "DELETE" }).catch(() => {});
    if (confirmDeleteProj.id === projectId) {
      get().newProject();
    }
  },
}));

export { loadProjects, saveProjectToStorage, genId };
