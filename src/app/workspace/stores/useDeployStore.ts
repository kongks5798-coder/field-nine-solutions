import { create } from "zustand";
import type { FrameworkType } from "../deploy/frameworkDetector";

// ── Types ──────────────────────────────────────────────────────────────────────

export type DeployTarget = "vercel" | "netlify" | "cloudflare" | "simulated";

export type DeployStatus =
  | "idle"
  | "detecting"
  | "building"
  | "uploading"
  | "deployed"
  | "error";

export interface DeployConfig {
  target: DeployTarget;
  buildCommand: string;
  outputDir: string;
  framework: FrameworkType;
}

export interface DeployRecord {
  id: string;
  timestamp: string;
  status: "success" | "failed";
  target: DeployTarget;
  url: string | null;
  buildDurationMs: number;
  commitId: string | null;
  buildLogs: string[];
}

// ── Storage ────────────────────────────────────────────────────────────────────

const DEPLOY_HIST_KEY = "f9_deploy_hist_v1";

function loadDeployHistory(): DeployRecord[] {
  try {
    const raw = localStorage.getItem(DEPLOY_HIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDeployHistory(records: DeployRecord[]) {
  try {
    localStorage.setItem(DEPLOY_HIST_KEY, JSON.stringify(records.slice(0, 20)));
  } catch { /* noop */ }
}

// ── Store ──────────────────────────────────────────────────────────────────────

interface DeployState {
  deployConfig: DeployConfig;
  deployStatus: DeployStatus;
  deployError: string | null;
  deployHistory: DeployRecord[];
  buildLogs: string[];
  previewUrl: string | null;
  showDeployPanel: boolean;
  showBuildLogs: boolean;

  setDeployConfig: (v: Partial<DeployConfig>) => void;
  setDeployStatus: (v: DeployStatus) => void;
  setDeployError: (v: string | null) => void;
  addBuildLog: (line: string) => void;
  clearBuildLogs: () => void;
  setPreviewUrl: (v: string | null) => void;
  setShowDeployPanel: (v: boolean) => void;
  setShowBuildLogs: (v: boolean) => void;

  detectFramework: () => void;
  startDeploy: () => Promise<void>;
  loadDeployHistory: () => void;
}

export const useDeployStore = create<DeployState>((set, get) => ({
  deployConfig: {
    target: "simulated",
    buildCommand: "",
    outputDir: "dist",
    framework: "unknown" as FrameworkType,
  },
  deployStatus: "idle",
  deployError: null,
  deployHistory: loadDeployHistory(),
  buildLogs: [],
  previewUrl: null,
  showDeployPanel: false,
  showBuildLogs: false,

  setDeployConfig: (v) =>
    set((s) => ({ deployConfig: { ...s.deployConfig, ...v } })),
  setDeployStatus: (v) => set({ deployStatus: v }),
  setDeployError: (v) => set({ deployError: v }),
  addBuildLog: (line) =>
    set((s) => ({ buildLogs: [...s.buildLogs, line] })),
  clearBuildLogs: () => set({ buildLogs: [] }),
  setPreviewUrl: (v) => set({ previewUrl: v }),
  setShowDeployPanel: (v) => set({ showDeployPanel: v }),
  setShowBuildLogs: (v) => set({ showBuildLogs: v }),

  detectFramework: () => {
    const { useFileSystemStore } = require("./useFileSystemStore");
    const files = useFileSystemStore.getState().files;
    const { detectFramework, getDefaultBuildCommand, getDefaultOutputDir } =
      require("../deploy/frameworkDetector");
    const fw = detectFramework(files);
    set({
      deployConfig: {
        ...get().deployConfig,
        framework: fw,
        buildCommand: getDefaultBuildCommand(fw),
        outputDir: getDefaultOutputDir(fw),
      },
    });
  },

  startDeploy: async () => {
    const { useFileSystemStore } = await import("./useFileSystemStore");
    const { useGitStore } = await import("./useGitStore");
    const { simulateBuild, simulateDeploy } = await import(
      "../deploy/buildSimulator"
    );
    const { detectFramework: detectFw, getDefaultBuildCommand, getDefaultOutputDir } =
      await import("../deploy/frameworkDetector");
    const { compressHtml, buildPreview, injectConsoleCapture, injectCdns } =
      await import("../workspace.constants");
    const { useEnvStore } = await import("./useEnvStore");

    const files = useFileSystemStore.getState().files;
    const gitState = useGitStore.getState().gitState;
    const cdnUrls = useEnvStore.getState().cdnUrls;
    const startTime = Date.now();

    set({ buildLogs: [], deployError: null, deployStatus: "detecting" });

    // 1. Detect framework
    const fw = detectFw(files);
    set({
      deployConfig: {
        ...get().deployConfig,
        framework: fw,
        buildCommand: getDefaultBuildCommand(fw),
        outputDir: getDefaultOutputDir(fw),
      },
    });

    // 2. Build
    set({ deployStatus: "building" });
    const logs: string[] = [];
    try {
      for await (const line of simulateBuild(files, fw)) {
        logs.push(line);
        set({ buildLogs: [...logs] });
      }
    } catch (err) {
      set({
        deployStatus: "error",
        deployError: `Build failed: ${String(err)}`,
      });
      return;
    }

    // 3. Deploy (simulate)
    set({ deployStatus: "uploading" });
    try {
      for await (const line of simulateDeploy(get().deployConfig.target)) {
        logs.push(line);
        set({ buildLogs: [...logs] });
      }
    } catch (err) {
      set({
        deployStatus: "error",
        deployError: `Deploy failed: ${String(err)}`,
      });
      return;
    }

    // 4. Generate preview URL
    let previewUrl: string | null = null;
    try {
      let html = buildPreview(files);
      html = injectConsoleCapture(html);
      if (cdnUrls?.length) html = injectCdns(html, cdnUrls);
      const compressed = await compressHtml(html);
      previewUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/p?d=${compressed}`;
    } catch { /* fallback to null */ }

    // 5. Record
    const record: DeployRecord = {
      id: `deploy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      status: "success",
      target: get().deployConfig.target,
      url: previewUrl,
      buildDurationMs: Date.now() - startTime,
      commitId: gitState.HEAD,
      buildLogs: logs,
    };

    const history = [record, ...get().deployHistory].slice(0, 20);
    saveDeployHistory(history);
    set({
      deployStatus: "deployed",
      deployHistory: history,
      previewUrl,
    });

    // Reset status after 5s
    setTimeout(() => {
      if (get().deployStatus === "deployed") {
        set({ deployStatus: "idle" });
      }
    }, 5000);
  },

  loadDeployHistory: () => {
    set({ deployHistory: loadDeployHistory() });
  },
}));
