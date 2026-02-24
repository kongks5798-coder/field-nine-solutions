import { create } from "zustand";

interface ParameterState {
  autonomyLevel: "low" | "medium" | "high" | "max";
  buildMode: "fast" | "full";
  temperature: number;
  maxTokens: number;
  customSystemPrompt: string;

  setAutonomyLevel: (v: "low" | "medium" | "high" | "max") => void;
  setBuildMode: (v: "fast" | "full") => void;
  setTemperature: (v: number) => void;
  setMaxTokens: (v: number) => void;
  setCustomSystemPrompt: (v: string) => void;
}

export const useParameterStore = create<ParameterState>((set) => ({
  autonomyLevel: "high",
  buildMode: "fast",
  temperature: 0.7,
  maxTokens: 4096,
  customSystemPrompt: "",

  setAutonomyLevel: (v) => set({ autonomyLevel: v }),
  setBuildMode: (v) => set({ buildMode: v }),
  setTemperature: (v) => set({ temperature: v }),
  setMaxTokens: (v) => set({ maxTokens: v }),
  setCustomSystemPrompt: (v) => set({ customSystemPrompt: v }),
}));
