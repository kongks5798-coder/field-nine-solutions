import { create } from "zustand";
import type { FrameworkType } from "../deploy/frameworkDetector";

// ── Types ──────────────────────────────────────────────────────────────────────

export type DeployTarget = "vercel" | "netlify" | "simulated";

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
const VERCEL_TOKEN_KEY = "f9_vercel_token";
const NETLIFY_TOKEN_KEY = "f9_netlify_token";

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

/** Load a deploy token from localStorage */
function loadToken(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

/** Save a deploy token to localStorage */
function saveToken(key: string, value: string) {
  try {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch { /* noop */ }
}

interface DeployState {
  deployConfig: DeployConfig;
  deployStatus: DeployStatus;
  deployError: string | null;
  deployHistory: DeployRecord[];
  buildLogs: string[];
  previewUrl: string | null;
  showDeployPanel: boolean;
  showBuildLogs: boolean;
  vercelToken: string;
  netlifyToken: string;

  setDeployConfig: (v: Partial<DeployConfig>) => void;
  setDeployStatus: (v: DeployStatus) => void;
  setDeployError: (v: string | null) => void;
  addBuildLog: (line: string) => void;
  clearBuildLogs: () => void;
  setPreviewUrl: (v: string | null) => void;
  setShowDeployPanel: (v: boolean) => void;
  setShowBuildLogs: (v: boolean) => void;
  setVercelToken: (v: string) => void;
  setNetlifyToken: (v: string) => void;

  detectFramework: () => Promise<void>;
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
  vercelToken: loadToken(VERCEL_TOKEN_KEY),
  netlifyToken: loadToken(NETLIFY_TOKEN_KEY),

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
  setVercelToken: (v) => { saveToken(VERCEL_TOKEN_KEY, v); set({ vercelToken: v }); },
  setNetlifyToken: (v) => { saveToken(NETLIFY_TOKEN_KEY, v); set({ netlifyToken: v }); },

  detectFramework: async () => {
    const { useFileSystemStore } = await import("./useFileSystemStore");
    const files = useFileSystemStore.getState().files;
    const { detectFramework: detectFw, getDefaultBuildCommand, getDefaultOutputDir } =
      await import("../deploy/frameworkDetector");
    const fw = detectFw(files);
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
    const target = get().deployConfig.target;
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

    const logs: string[] = [];
    const addLog = (line: string) => {
      logs.push(line);
      set({ buildLogs: [...logs] });
    };

    // ── Real Vercel / Netlify deploy ────────────────────────────────────────
    if (target === "vercel" || target === "netlify") {
      const token = target === "vercel" ? get().vercelToken : get().netlifyToken;
      if (!token) {
        set({
          deployStatus: "error",
          deployError: `${target === "vercel" ? "Vercel" : "Netlify"} API 토큰이 설정되지 않았습니다. 패널 설정에서 토큰을 입력하세요.`,
        });
        return;
      }

      // Build step (simulated build for log output)
      set({ deployStatus: "building" });
      try {
        for await (const line of simulateBuild(files, fw)) {
          addLog(line);
        }
      } catch (err) {
        set({ deployStatus: "error", deployError: `Build failed: ${String(err)}` });
        return;
      }

      // Real upload
      set({ deployStatus: "uploading" });
      addLog(`\x1b[36m▶ ${target} API에 배포 중...\x1b[0m`);

      // Prepare file contents (raw strings)
      const fileContents: Record<string, string> = {};
      for (const [fname, fdata] of Object.entries(files)) {
        if (typeof fdata === "object" && fdata !== null && "content" in fdata) {
          fileContents[fname] = (fdata as { content: string }).content;
        }
      }

      const projectName = `f9-${Date.now().toString(36)}`;
      const apiUrl = target === "vercel" ? "/api/deploy/vercel" : "/api/deploy/netlify";

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectName,
            files: fileContents,
            framework: fw !== "unknown" ? fw : undefined,
            token,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          addLog(`\x1b[31m✗ 배포 실패: ${data.error || "Unknown error"}\x1b[0m`);
          set({ deployStatus: "error", deployError: data.error || `${target} 배포 실패` });
          return;
        }

        const deployedUrl = data.url;
        addLog(`\x1b[32m✓ 배포 완료! URL: ${deployedUrl}\x1b[0m`);
        if (data.deploymentId) addLog(`\x1b[2m  Deployment ID: ${data.deploymentId}\x1b[0m`);

        // Record
        const record: DeployRecord = {
          id: data.deploymentId || `deploy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          status: "success",
          target,
          url: deployedUrl,
          buildDurationMs: Date.now() - startTime,
          commitId: gitState.HEAD,
          buildLogs: logs,
        };

        const history = [record, ...get().deployHistory].slice(0, 20);
        saveDeployHistory(history);
        set({
          deployStatus: "deployed",
          deployHistory: history,
          previewUrl: deployedUrl,
        });

        // Reset status after 8s (longer for real deploys)
        setTimeout(() => {
          if (get().deployStatus === "deployed") {
            set({ deployStatus: "idle" });
          }
        }, 8000);
        return;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        addLog(`\x1b[31m✗ 네트워크 오류: ${errMsg}\x1b[0m`);
        set({ deployStatus: "error", deployError: `배포 실패: ${errMsg}` });
        return;
      }
    }

    // ── Simulated deploy ────────────────────────────────────────────────────

    // 2. Build
    set({ deployStatus: "building" });
    try {
      for await (const line of simulateBuild(files, fw)) {
        addLog(line);
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
        addLog(line);
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
