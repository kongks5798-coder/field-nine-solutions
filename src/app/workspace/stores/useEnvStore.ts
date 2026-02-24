import { create } from "zustand";
import { ENV_VARS_KEY } from "../workspace.constants";

interface EnvState {
  envVars: Record<string, string>;
  cdnUrls: string[];

  setEnvVars: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setCdnUrls: (v: string[] | ((prev: string[]) => string[])) => void;
  persistEnvVars: () => void;
}

export const useEnvStore = create<EnvState>((set, get) => ({
  envVars: typeof window !== "undefined"
    ? (() => { try { return JSON.parse(localStorage.getItem(ENV_VARS_KEY) || "{}"); } catch { return {}; } })()
    : {},
  cdnUrls: [],

  setEnvVars: (v) => {
    set((s) => {
      const next = typeof v === "function" ? v(s.envVars) : v;
      try { localStorage.setItem(ENV_VARS_KEY, JSON.stringify(next)); } catch {}
      return { envVars: next };
    });
  },
  setCdnUrls: (v) => set((s) => ({ cdnUrls: typeof v === "function" ? v(s.cdnUrls) : v })),
  persistEnvVars: () => {
    const { envVars } = get();
    try { localStorage.setItem(ENV_VARS_KEY, JSON.stringify(envVars)); } catch {}
  },
}));
