import { describe, it, expect, beforeEach, vi } from "vitest";
import { useDeployStore, type DeployRecord } from "../../src/app/workspace/stores/useDeployStore";

// Mock localStorage
const storage: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => { storage[key] = val; },
  removeItem: (key: string) => { delete storage[key]; },
});

function resetStore() {
  for (const k of Object.keys(storage)) delete storage[k];
  useDeployStore.setState({
    deployConfig: {
      target: "simulated",
      buildCommand: "",
      outputDir: "dist",
      framework: "unknown",
    },
    deployStatus: "idle",
    deployError: null,
    deployHistory: [],
    buildLogs: [],
    previewUrl: null,
    showDeployPanel: false,
    showBuildLogs: false,
  });
}

const fakeRecord: DeployRecord = {
  id: "deploy-1",
  timestamp: new Date().toISOString(),
  status: "success",
  target: "simulated",
  url: "https://example.com",
  buildDurationMs: 3200,
  commitId: "abc123",
  buildLogs: ["Build started", "Build complete"],
};

describe("useDeployStore", () => {
  beforeEach(() => resetStore());

  describe("initial state", () => {
    it("starts with idle status", () => {
      expect(useDeployStore.getState().deployStatus).toBe("idle");
    });

    it("starts with default config", () => {
      const config = useDeployStore.getState().deployConfig;
      expect(config.target).toBe("simulated");
      expect(config.framework).toBe("unknown");
    });
  });

  describe("setDeployConfig", () => {
    it("merges partial config", () => {
      useDeployStore.getState().setDeployConfig({ target: "vercel", framework: "next" });
      const config = useDeployStore.getState().deployConfig;
      expect(config.target).toBe("vercel");
      expect(config.framework).toBe("next");
      expect(config.outputDir).toBe("dist"); // unchanged
    });

    it("updates build command", () => {
      useDeployStore.getState().setDeployConfig({ buildCommand: "npm run build" });
      expect(useDeployStore.getState().deployConfig.buildCommand).toBe("npm run build");
    });
  });

  describe("build logs", () => {
    it("adds log lines", () => {
      const { addBuildLog } = useDeployStore.getState();
      addBuildLog("Step 1");
      addBuildLog("Step 2");
      expect(useDeployStore.getState().buildLogs).toEqual(["Step 1", "Step 2"]);
    });

    it("clears build logs", () => {
      useDeployStore.setState({ buildLogs: ["old log"] });
      useDeployStore.getState().clearBuildLogs();
      expect(useDeployStore.getState().buildLogs).toEqual([]);
    });
  });

  describe("deploy history", () => {
    it("loadDeployHistory loads from localStorage", () => {
      storage["f9_deploy_hist_v1"] = JSON.stringify([fakeRecord]);
      useDeployStore.getState().loadDeployHistory();
      expect(useDeployStore.getState().deployHistory).toHaveLength(1);
      expect(useDeployStore.getState().deployHistory[0].id).toBe("deploy-1");
    });

    it("loadDeployHistory handles empty storage", () => {
      useDeployStore.getState().loadDeployHistory();
      expect(useDeployStore.getState().deployHistory).toEqual([]);
    });

    it("loadDeployHistory handles corrupt storage", () => {
      storage["f9_deploy_hist_v1"] = "not-json";
      useDeployStore.getState().loadDeployHistory();
      expect(useDeployStore.getState().deployHistory).toEqual([]);
    });
  });

  describe("setters", () => {
    it("setDeployStatus", () => {
      useDeployStore.getState().setDeployStatus("building");
      expect(useDeployStore.getState().deployStatus).toBe("building");
    });

    it("setDeployError", () => {
      useDeployStore.getState().setDeployError("Something failed");
      expect(useDeployStore.getState().deployError).toBe("Something failed");
    });

    it("setPreviewUrl", () => {
      useDeployStore.getState().setPreviewUrl("https://preview.example.com");
      expect(useDeployStore.getState().previewUrl).toBe("https://preview.example.com");
    });

    it("setShowDeployPanel", () => {
      useDeployStore.getState().setShowDeployPanel(true);
      expect(useDeployStore.getState().showDeployPanel).toBe(true);
    });

    it("setShowBuildLogs", () => {
      useDeployStore.getState().setShowBuildLogs(true);
      expect(useDeployStore.getState().showBuildLogs).toBe(true);
    });
  });
});
