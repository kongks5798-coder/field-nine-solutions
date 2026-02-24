import { create } from "zustand";
import type { NpmSearchResult } from "../package/npmRegistry";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PackageDep {
  name: string;
  version: string;
  type: "dep" | "devDep";
  description: string;
  homepage: string;
  size: number;
  dependencies: string[];
}

export type PackageInstallStatus =
  | "idle"
  | "resolving"
  | "installing"
  | "installed"
  | "error";

// ── Storage ────────────────────────────────────────────────────────────────────

const PKG_STORAGE_KEY = "f9_packages_v1";

function loadPackages(): PackageDep[] {
  try {
    const raw = localStorage.getItem(PKG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePackages(pkgs: PackageDep[]) {
  try {
    localStorage.setItem(PKG_STORAGE_KEY, JSON.stringify(pkgs));
  } catch { /* noop */ }
}

// ── Store ──────────────────────────────────────────────────────────────────────

interface PackageState {
  packages: PackageDep[];
  installStatus: PackageInstallStatus;
  installError: string | null;
  searchQuery: string;
  searchResults: NpmSearchResult[];
  searchLoading: boolean;
  depGraphExpanded: boolean;

  setPackages: (v: PackageDep[] | ((prev: PackageDep[]) => PackageDep[])) => void;
  setInstallStatus: (v: PackageInstallStatus) => void;
  setInstallError: (v: string | null) => void;
  setSearchQuery: (v: string) => void;
  setSearchResults: (v: NpmSearchResult[]) => void;
  setSearchLoading: (v: boolean) => void;
  setDepGraphExpanded: (v: boolean) => void;

  installPackage: (name: string, version?: string, isDev?: boolean) => Promise<void>;
  uninstallPackage: (name: string) => void;
  searchNpm: (query: string) => Promise<void>;
  syncFromPackageJson: (content: string) => void;
  getPackageJson: () => string;
}

export const usePackageStore = create<PackageState>((set, get) => ({
  packages: loadPackages(),
  installStatus: "idle",
  installError: null,
  searchQuery: "",
  searchResults: [],
  searchLoading: false,
  depGraphExpanded: false,

  setPackages: (v) =>
    set((s) => {
      const next = typeof v === "function" ? v(s.packages) : v;
      savePackages(next);
      return { packages: next };
    }),
  setInstallStatus: (v) => set({ installStatus: v }),
  setInstallError: (v) => set({ installError: v }),
  setSearchQuery: (v) => set({ searchQuery: v }),
  setSearchResults: (v) => set({ searchResults: v }),
  setSearchLoading: (v) => set({ searchLoading: v }),
  setDepGraphExpanded: (v) => set({ depGraphExpanded: v }),

  installPackage: async (name, version, isDev) => {
    const { packages } = get();
    if (packages.some((p) => p.name === name)) {
      set({ installError: `${name} is already installed` });
      return;
    }

    set({ installStatus: "resolving", installError: null });
    try {
      const { getPackageMetadata, estimateBundleSize } = await import(
        "../package/npmRegistry"
      );
      const meta = await getPackageMetadata(name);
      if (!meta) {
        set({ installStatus: "error", installError: `Package '${name}' not found` });
        return;
      }

      set({ installStatus: "installing" });

      const dep: PackageDep = {
        name: meta.name,
        version: version ?? meta.version,
        type: isDev ? "devDep" : "dep",
        description: meta.description,
        homepage: meta.homepage,
        size: estimateBundleSize(meta),
        dependencies: Object.keys(meta.dependencies),
      };

      const next = [...packages, dep];
      savePackages(next);
      set({ packages: next, installStatus: "installed" });

      // Auto-reset status after 2s
      setTimeout(() => {
        if (get().installStatus === "installed") {
          set({ installStatus: "idle" });
        }
      }, 2000);
    } catch (err) {
      set({
        installStatus: "error",
        installError: err instanceof Error ? err.message : String(err),
      });
    }
  },

  uninstallPackage: (name) => {
    const next = get().packages.filter((p) => p.name !== name);
    savePackages(next);
    set({ packages: next });
  },

  searchNpm: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], searchLoading: false });
      return;
    }
    set({ searchQuery: query, searchLoading: true });
    try {
      const { searchNpmPackages } = await import("../package/npmRegistry");
      const results = await searchNpmPackages(query);
      set({ searchResults: results, searchLoading: false });
    } catch {
      set({ searchResults: [], searchLoading: false });
    }
  },

  syncFromPackageJson: (content) => {
    try {
      const parsed = JSON.parse(content);
      const deps: PackageDep[] = [];
      for (const [name, ver] of Object.entries(parsed.dependencies ?? {})) {
        deps.push({
          name,
          version: String(ver),
          type: "dep",
          description: "",
          homepage: "",
          size: 0,
          dependencies: [],
        });
      }
      for (const [name, ver] of Object.entries(parsed.devDependencies ?? {})) {
        deps.push({
          name,
          version: String(ver),
          type: "devDep",
          description: "",
          homepage: "",
          size: 0,
          dependencies: [],
        });
      }
      savePackages(deps);
      set({ packages: deps });
    } catch { /* invalid JSON, ignore */ }
  },

  getPackageJson: () => {
    const { packages } = get();
    const deps: Record<string, string> = {};
    const devDeps: Record<string, string> = {};
    for (const p of packages) {
      if (p.type === "devDep") devDeps[p.name] = `^${p.version}`;
      else deps[p.name] = `^${p.version}`;
    }
    const obj: Record<string, unknown> = {
      name: "my-project",
      version: "1.0.0",
      private: true,
    };
    if (Object.keys(deps).length > 0) obj.dependencies = deps;
    if (Object.keys(devDeps).length > 0) obj.devDependencies = devDeps;
    return JSON.stringify(obj, null, 2);
  },
}));
