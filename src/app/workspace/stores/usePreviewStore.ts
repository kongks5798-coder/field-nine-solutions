import { create } from "zustand";
import type { LogEntry, LogLevel } from "../workspace.constants";

interface PreviewState {
  previewSrc: string;
  iframeKey: number;
  hasRun: boolean;
  previewRefreshing: boolean;
  logs: LogEntry[];
  errorCount: number;

  setPreviewSrc: (v: string) => void;
  setIframeKey: (v: number | ((prev: number) => number)) => void;
  setHasRun: (v: boolean) => void;
  setPreviewRefreshing: (v: boolean) => void;
  setLogs: (v: LogEntry[] | ((prev: LogEntry[]) => LogEntry[])) => void;
  setErrorCount: (v: number | ((prev: number) => number)) => void;
  addLog: (level: LogLevel, msg: string, ts: string) => void;
  clearLogs: () => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  previewSrc: "",
  iframeKey: 0,
  hasRun: false,
  previewRefreshing: false,
  logs: [],
  errorCount: 0,

  setPreviewSrc: (v) => set({ previewSrc: v }),
  setIframeKey: (v) => set((s) => ({ iframeKey: typeof v === "function" ? v(s.iframeKey) : v })),
  setHasRun: (v) => set({ hasRun: v }),
  setPreviewRefreshing: (v) => set({ previewRefreshing: v }),
  setLogs: (v) => set((s) => ({ logs: typeof v === "function" ? v(s.logs) : v })),
  setErrorCount: (v) => set((s) => ({ errorCount: typeof v === "function" ? v(s.errorCount) : v })),
  addLog: (level, msg, ts) =>
    set((s) => ({
      logs: [...s.logs.slice(-199), { level, msg, ts }],
      errorCount: level === "error" ? s.errorCount + 1 : s.errorCount,
    })),
  clearLogs: () => set({ logs: [], errorCount: 0 }),
}));
