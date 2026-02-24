/**
 * useGitStore — Zustand store for Virtual Git state.
 * Persists to localStorage per project ID.
 * Bridges VirtualGit pure functions with the workspace file system.
 */
import { create } from "zustand";
import type { GitState, FileDiff } from "../git/VirtualGit";
import {
  createInitialGitState,
  createCommit,
  createBranch,
  switchBranch,
  getCommitLog,
  diffWorkingTree,
  snapshotFromFiles,
  getCommitFiles,
} from "../git/VirtualGit";
import { extToLang } from "../workspace.constants";
import type { FilesMap } from "../workspace.constants";
import { useFileSystemStore } from "./useFileSystemStore";
import { useProjectStore } from "./useProjectStore";

// ── localStorage helpers ───────────────────────────────────────────────────────

function storageKey(): string {
  const projectId = useProjectStore.getState().projectId;
  return `git_${projectId}`;
}

function loadGitState(): GitState {
  if (typeof window === "undefined") return createInitialGitState();
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) return JSON.parse(raw) as GitState;
  } catch {
    // Corrupted storage — reset
  }
  return createInitialGitState();
}

function saveGitState(state: GitState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently skip
  }
}

// ── Store ──────────────────────────────────────────────────────────────────────

interface GitStoreState {
  gitState: GitState;
  showGitPanel: boolean;
  selectedCommitId: string | null;

  // Actions
  commit: (message: string) => void;
  branch: (name: string) => void;
  checkout: (branchName: string) => void;
  setShowGitPanel: (v: boolean) => void;
  setSelectedCommitId: (v: string | null) => void;
  loadFromStorage: () => void;

  // Derived (computed in selectors instead, but handy helpers)
  getLog: (limit?: number) => ReturnType<typeof getCommitLog>;
  getWorkingDiff: () => FileDiff[];
  getChangedFileCount: () => number;
}

export const useGitStore = create<GitStoreState>((set, get) => ({
  gitState: loadGitState(),
  showGitPanel: false,
  selectedCommitId: null,

  commit: (message: string) => {
    const files = useFileSystemStore.getState().files;
    const snapshot = snapshotFromFiles(files);
    const next = createCommit(get().gitState, message, snapshot);
    set({ gitState: next });
    saveGitState(next);
  },

  branch: (name: string) => {
    const next = createBranch(get().gitState, name);
    set({ gitState: next });
    saveGitState(next);
  },

  checkout: (branchName: string) => {
    const next = switchBranch(get().gitState, branchName);
    set({ gitState: next, selectedCommitId: null });
    saveGitState(next);

    // Restore files from the branch's HEAD commit
    if (next.HEAD) {
      const commitFiles = getCommitFiles(next, next.HEAD);
      if (commitFiles) {
        const fsStore = useFileSystemStore.getState();
        // Convert string map back to FilesMap with FileNode shape
        const filesMap: FilesMap = {};
        for (const [name, content] of Object.entries(commitFiles)) {
          filesMap[name] = { name, language: extToLang(name), content };
        }
        fsStore.setFiles(filesMap);
        // Update open tabs to reflect available files
        const availableNames = Object.keys(filesMap);
        const currentTabs = fsStore.openTabs.filter((t) => availableNames.includes(t));
        if (currentTabs.length === 0 && availableNames.length > 0) {
          currentTabs.push(availableNames[0]);
        }
        fsStore.setOpenTabs(currentTabs);
        if (!availableNames.includes(fsStore.activeFile) && availableNames.length > 0) {
          fsStore.setActiveFile(availableNames[0]);
        }
      }
    }
  },

  setShowGitPanel: (v) => set({ showGitPanel: v }),
  setSelectedCommitId: (v) => set({ selectedCommitId: v }),

  loadFromStorage: () => {
    set({ gitState: loadGitState(), selectedCommitId: null });
  },

  getLog: (limit) => getCommitLog(get().gitState, limit),

  getWorkingDiff: () => {
    const files = useFileSystemStore.getState().files;
    const snapshot = snapshotFromFiles(files);
    return diffWorkingTree(get().gitState, snapshot);
  },

  getChangedFileCount: () => {
    const files = useFileSystemStore.getState().files;
    const snapshot = snapshotFromFiles(files);
    return diffWorkingTree(get().gitState, snapshot).length;
  },
}));
