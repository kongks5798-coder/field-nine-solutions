import { create } from "zustand";
import type { FilesMap, FileNode, HistoryEntry, Lang } from "../workspace.constants";
import { DEFAULT_FILES, extToLang, nowTs } from "../workspace.constants";

interface FileSystemState {
  files: FilesMap;
  activeFile: string;
  openTabs: string[];
  changedFiles: string[];
  history: HistoryEntry[];
  showVersionHistory: boolean;
  showNewFile: boolean;
  newFileName: string;

  // Actions
  setFiles: (files: FilesMap | ((prev: FilesMap) => FilesMap)) => void;
  setActiveFile: (name: string) => void;
  setOpenTabs: (tabs: string[] | ((prev: string[]) => string[])) => void;
  setChangedFiles: (files: string[] | ((prev: string[]) => string[])) => void;
  setHistory: (h: HistoryEntry[] | ((prev: HistoryEntry[]) => HistoryEntry[])) => void;
  setShowVersionHistory: (v: boolean) => void;
  setShowNewFile: (v: boolean) => void;
  setNewFileName: (v: string) => void;

  openFile: (name: string) => void;
  closeTab: (name: string) => void;
  createFile: (name: string) => void;
  deleteFile: (name: string) => void;
  updateFileContent: (filename: string, content: string) => void;
  pushHistory: (label: string) => void;
  revertHistory: () => void;
  importFiles: (imported: Record<string, FileNode>) => void;
  resetFiles: (files?: FilesMap, tabs?: string[]) => void;
}

export const useFileSystemStore = create<FileSystemState>((set, get) => ({
  files: { ...DEFAULT_FILES },
  activeFile: "index.html",
  openTabs: ["index.html", "style.css", "script.js"],
  changedFiles: [],
  history: [],
  showVersionHistory: false,
  showNewFile: false,
  newFileName: "",

  setFiles: (arg) => set((s) => ({ files: typeof arg === "function" ? arg(s.files) : arg })),
  setActiveFile: (name) => set({ activeFile: name }),
  setOpenTabs: (arg) => set((s) => ({ openTabs: typeof arg === "function" ? arg(s.openTabs) : arg })),
  setChangedFiles: (arg) => set((s) => ({ changedFiles: typeof arg === "function" ? arg(s.changedFiles) : arg })),
  setHistory: (arg) => set((s) => ({ history: typeof arg === "function" ? arg(s.history) : arg })),
  setShowVersionHistory: (v) => set({ showVersionHistory: v }),
  setShowNewFile: (v) => set({ showNewFile: v }),
  setNewFileName: (v) => set({ newFileName: v }),

  openFile: (name) => {
    const { openTabs } = get();
    set({ activeFile: name });
    if (!openTabs.includes(name)) set({ openTabs: [...openTabs, name] });
  },

  closeTab: (name) => {
    const { openTabs, activeFile, files } = get();
    const next = openTabs.filter((t) => t !== name);
    set({ openTabs: next });
    if (activeFile === name) set({ activeFile: next[next.length - 1] ?? Object.keys(files)[0] ?? "" });
  },

  createFile: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { openTabs } = get();
    set((s) => ({
      files: { ...s.files, [trimmed]: { name: trimmed, language: extToLang(trimmed), content: "" } },
      activeFile: trimmed,
      openTabs: openTabs.includes(trimmed) ? openTabs : [...openTabs, trimmed],
      showNewFile: false,
      newFileName: "",
    }));
  },

  deleteFile: (name) => {
    const { activeFile, files } = get();
    set((s) => {
      const n = { ...s.files };
      delete n[name];
      return {
        files: n,
        openTabs: s.openTabs.filter((t) => t !== name),
        activeFile: activeFile === name ? (Object.keys(n)[0] ?? "") : activeFile,
      };
    });
  },

  updateFileContent: (filename, content) => {
    set((s) => ({
      files: { ...s.files, [filename]: { ...s.files[filename], content } },
    }));
  },

  pushHistory: (label) => {
    const { files } = get();
    set((s) => ({
      history: [...s.history.slice(-19), { files: { ...files }, ts: nowTs(), label, epoch: Date.now() }],
    }));
  },

  revertHistory: () => {
    set((s) => {
      if (s.history.length === 0) return s;
      const last = s.history[s.history.length - 1];
      return { files: last.files, history: s.history.slice(0, -1) };
    });
  },

  importFiles: (imported) => {
    const { files, openTabs, pushHistory: ph } = get();
    ph("파일 가져오기 전");
    const updated = { ...files, ...imported };
    const newNames = Object.keys(imported);
    const nextTabs = [...openTabs];
    for (const f of newNames) if (!nextTabs.includes(f)) nextTabs.push(f);
    set({
      files: updated,
      openTabs: nextTabs,
      activeFile: newNames[0] ?? get().activeFile,
    });
  },

  resetFiles: (files, tabs) => {
    set({
      files: files ?? { ...DEFAULT_FILES },
      openTabs: tabs ?? ["index.html", "style.css", "script.js"],
      activeFile: "index.html",
      history: [],
    });
  },
}));
