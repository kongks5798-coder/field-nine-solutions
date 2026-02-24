import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePackageStore, type PackageDep } from "../../src/app/workspace/stores/usePackageStore";

// Mock localStorage
const storage: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => { storage[key] = val; },
  removeItem: (key: string) => { delete storage[key]; },
});

function resetStore() {
  for (const k of Object.keys(storage)) delete storage[k];
  usePackageStore.setState({
    packages: [],
    installStatus: "idle",
    installError: null,
    searchQuery: "",
    searchResults: [],
    searchLoading: false,
    depGraphExpanded: false,
  });
}

const fakePkg: PackageDep = {
  name: "lodash",
  version: "4.17.21",
  type: "dep",
  description: "Utility library",
  homepage: "https://lodash.com",
  size: 72000,
  dependencies: [],
};

describe("usePackageStore", () => {
  beforeEach(() => resetStore());

  describe("installPackage", () => {
    it("rejects duplicates", async () => {
      usePackageStore.setState({ packages: [fakePkg] });
      await usePackageStore.getState().installPackage("lodash");
      expect(usePackageStore.getState().installError).toContain("already installed");
    });
  });

  describe("uninstallPackage", () => {
    it("removes a package", () => {
      usePackageStore.setState({ packages: [fakePkg] });
      usePackageStore.getState().uninstallPackage("lodash");
      expect(usePackageStore.getState().packages).toHaveLength(0);
    });

    it("persists to localStorage", () => {
      usePackageStore.setState({ packages: [fakePkg] });
      usePackageStore.getState().uninstallPackage("lodash");
      const saved = JSON.parse(storage["f9_packages_v1"] ?? "[]");
      expect(saved).toHaveLength(0);
    });

    it("ignores missing packages", () => {
      usePackageStore.setState({ packages: [fakePkg] });
      usePackageStore.getState().uninstallPackage("nonexistent");
      expect(usePackageStore.getState().packages).toHaveLength(1);
    });
  });

  describe("searchNpm", () => {
    it("clears results for empty query", async () => {
      usePackageStore.setState({ searchResults: [{ name: "x", version: "1", description: "", weeklyDownloads: 0, homepage: "" }] });
      await usePackageStore.getState().searchNpm("");
      expect(usePackageStore.getState().searchResults).toEqual([]);
      expect(usePackageStore.getState().searchLoading).toBe(false);
    });

    it("clears results for whitespace query", async () => {
      await usePackageStore.getState().searchNpm("   ");
      expect(usePackageStore.getState().searchResults).toEqual([]);
    });
  });

  describe("syncFromPackageJson", () => {
    it("syncs dependencies from package.json content", () => {
      const content = JSON.stringify({
        dependencies: { react: "^18.2.0", "react-dom": "^18.2.0" },
        devDependencies: { typescript: "^5.0.0" },
      });
      usePackageStore.getState().syncFromPackageJson(content);
      const pkgs = usePackageStore.getState().packages;
      expect(pkgs).toHaveLength(3);
      expect(pkgs.find((p) => p.name === "react")?.type).toBe("dep");
      expect(pkgs.find((p) => p.name === "typescript")?.type).toBe("devDep");
    });

    it("handles empty dependencies", () => {
      usePackageStore.getState().syncFromPackageJson(JSON.stringify({}));
      expect(usePackageStore.getState().packages).toHaveLength(0);
    });

    it("ignores invalid JSON", () => {
      usePackageStore.setState({ packages: [fakePkg] });
      usePackageStore.getState().syncFromPackageJson("not json");
      expect(usePackageStore.getState().packages).toHaveLength(1);
    });

    it("persists synced packages to localStorage", () => {
      const content = JSON.stringify({ dependencies: { axios: "^1.0.0" } });
      usePackageStore.getState().syncFromPackageJson(content);
      const saved = JSON.parse(storage["f9_packages_v1"] ?? "[]");
      expect(saved).toHaveLength(1);
      expect(saved[0].name).toBe("axios");
    });
  });

  describe("getPackageJson", () => {
    it("generates valid package.json", () => {
      usePackageStore.setState({
        packages: [
          { ...fakePkg, name: "react", version: "18.2.0", type: "dep" },
          { ...fakePkg, name: "vitest", version: "1.0.0", type: "devDep" },
        ],
      });
      const json = JSON.parse(usePackageStore.getState().getPackageJson());
      expect(json.name).toBe("my-project");
      expect(json.dependencies.react).toBe("^18.2.0");
      expect(json.devDependencies.vitest).toBe("^1.0.0");
    });

    it("omits empty dependency sections", () => {
      usePackageStore.setState({ packages: [] });
      const json = JSON.parse(usePackageStore.getState().getPackageJson());
      expect(json.dependencies).toBeUndefined();
      expect(json.devDependencies).toBeUndefined();
    });

    it("only includes devDependencies when no deps", () => {
      usePackageStore.setState({
        packages: [{ ...fakePkg, name: "eslint", type: "devDep" }],
      });
      const json = JSON.parse(usePackageStore.getState().getPackageJson());
      expect(json.dependencies).toBeUndefined();
      expect(json.devDependencies.eslint).toBeDefined();
    });
  });

  describe("setters", () => {
    it("setPackages with function updater", () => {
      usePackageStore.setState({ packages: [fakePkg] });
      usePackageStore.getState().setPackages((prev) => [...prev, { ...fakePkg, name: "axios" }]);
      expect(usePackageStore.getState().packages).toHaveLength(2);
    });

    it("setPackages with direct value", () => {
      usePackageStore.getState().setPackages([fakePkg]);
      expect(usePackageStore.getState().packages).toHaveLength(1);
    });

    it("setInstallStatus", () => {
      usePackageStore.getState().setInstallStatus("installing");
      expect(usePackageStore.getState().installStatus).toBe("installing");
    });

    it("setDepGraphExpanded", () => {
      usePackageStore.getState().setDepGraphExpanded(true);
      expect(usePackageStore.getState().depGraphExpanded).toBe(true);
    });
  });
});
