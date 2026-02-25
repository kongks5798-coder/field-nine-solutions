import { create } from "zustand";

export type AgentMode = "economy" | "power" | "turbo";
export type ThemeMode = "light" | "dark";

interface ParameterState {
  autonomyLevel: "low" | "medium" | "high" | "max";
  buildMode: "fast" | "full";
  commercialMode: boolean;
  agentMode: AgentMode;
  themeMode: ThemeMode;
  temperature: number;
  maxTokens: number;
  customSystemPrompt: string;

  setAutonomyLevel: (v: "low" | "medium" | "high" | "max") => void;
  setBuildMode: (v: "fast" | "full") => void;
  setCommercialMode: (v: boolean) => void;
  setAgentMode: (v: AgentMode) => void;
  setThemeMode: (v: ThemeMode) => void;
  setTemperature: (v: number) => void;
  setMaxTokens: (v: number) => void;
  setCustomSystemPrompt: (v: string) => void;
}

export const useParameterStore = create<ParameterState>((set) => ({
  autonomyLevel: "high",
  buildMode: "fast",
  commercialMode: false,
  agentMode: "power",
  themeMode: "light",
  temperature: 0.7,
  maxTokens: 4096,
  customSystemPrompt: "",

  setAutonomyLevel: (v) => set({ autonomyLevel: v }),
  setBuildMode: (v) => set({ buildMode: v }),
  setCommercialMode: (v) => set({ commercialMode: v }),
  setAgentMode: (v) => {
    // Sync legacy fields for backward compatibility
    const commercialMode = v === "turbo";
    const buildMode = v === "economy" ? "fast" as const : "full" as const;
    set({ agentMode: v, commercialMode, buildMode });
  },
  setThemeMode: (v) => set({ themeMode: v }),
  setTemperature: (v) => set({ temperature: v }),
  setMaxTokens: (v) => set({ maxTokens: v }),
  setCustomSystemPrompt: (v) => set({ customSystemPrompt: v }),
}));
