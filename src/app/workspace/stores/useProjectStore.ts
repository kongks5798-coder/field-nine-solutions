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

// Debounced server save — max 1 request per 1500ms per project
const _saveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function scheduleServerSave(p: Project) {
  if (typeof window === "undefined") return;
  if (_saveTimers[p.id]) clearTimeout(_saveTimers[p.id]);
  _saveTimers[p.id] = setTimeout(async () => {
    delete _saveTimers[p.id];
    try {
      const filesSize = JSON.stringify(p.files).length;
      if (filesSize > 480 * 1024) return; // Skip if > 480KB (server limit is 500KB)
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, name: p.name, files: p.files }),
      });
    } catch {
      // Silent fail — localStorage is source of truth
    }
  }, 1500);
}

interface ProjectState {
  projectId: string;
  projectName: string;
  projects: Project[];
  showProjects: boolean;
  confirmDeleteProj: Project | null;
  serverSyncStatus: "idle" | "saving" | "saved" | "error";

  setProjectId: (id: string) => void;
  setProjectName: (name: string) => void;
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  setShowProjects: (v: boolean) => void;
  setConfirmDeleteProj: (p: Project | null) => void;
  setServerSyncStatus: (s: "idle" | "saving" | "saved" | "error") => void;

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
  serverSyncStatus: "idle",

  setProjectId: (id) => set({ projectId: id }),
  setProjectName: (name) => set({ projectName: name }),
  setProjects: (arg) => set((s) => ({ projects: typeof arg === "function" ? arg(s.projects) : arg })),
  setShowProjects: (v) => set({ showProjects: v }),
  setConfirmDeleteProj: (p) => set({ confirmDeleteProj: p }),
  setServerSyncStatus: (s) => set({ serverSyncStatus: s }),

  loadProjectsFromStorage: () => set({ projects: loadProjects() }),

  saveProject: (p) => {
    saveProjectToStorage(p);
    localStorage.setItem(CUR_KEY, p.id);
    set({ projects: loadProjects(), serverSyncStatus: "saving" });
    // Debounced server sync
    scheduleServerSave(p);
    // Update status to "saved" after debounce period
    setTimeout(() => {
      set((s) => s.serverSyncStatus === "saving" ? { serverSyncStatus: "saved" } : s);
      setTimeout(() => set((s) => s.serverSyncStatus === "saved" ? { serverSyncStatus: "idle" } : s), 2000);
    }, 2000);
  },

  newProject: () => {
    const id = genId();
    const f = { ...DEFAULT_FILES };
    saveProjectToStorage({ id, name: "새 프로젝트", files: f, updatedAt: new Date().toISOString() });
    localStorage.setItem(CUR_KEY, id);
    set({ projectId: id, projectName: "새 프로젝트", showProjects: false, serverSyncStatus: "idle" });
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
