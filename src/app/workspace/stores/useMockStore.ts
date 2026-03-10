import { create } from "zustand";
import { type MockPreset } from "../ai/mockApiInjector";

const MOCK_STORE_KEY = "f9_mock_presets_v1";

interface MockState {
  enabledPresets: MockPreset[];
  mockEnabled: boolean;
  setMockEnabled: (v: boolean) => void;
  togglePreset: (preset: MockPreset) => void;
  setEnabledPresets: (v: MockPreset[]) => void;
}

function loadFromStorage(): { enabled: boolean; presets: MockPreset[] } {
  if (typeof window === "undefined") return { enabled: false, presets: [] };
  try {
    const raw = localStorage.getItem(MOCK_STORE_KEY);
    if (!raw) return { enabled: false, presets: [] };
    return JSON.parse(raw) as { enabled: boolean; presets: MockPreset[] };
  } catch {
    return { enabled: false, presets: [] };
  }
}

function saveToStorage(enabled: boolean, presets: MockPreset[]): void {
  try { localStorage.setItem(MOCK_STORE_KEY, JSON.stringify({ enabled, presets })); } catch { /* ignore */ }
}

const initial = loadFromStorage();

export const useMockStore = create<MockState>((set, get) => ({
  mockEnabled: initial.enabled,
  enabledPresets: initial.presets,

  setMockEnabled: (v) => {
    set({ mockEnabled: v });
    saveToStorage(v, get().enabledPresets);
  },

  togglePreset: (preset) => {
    const current = get().enabledPresets;
    const next = current.includes(preset)
      ? current.filter(p => p !== preset)
      : [...current, preset];
    set({ enabledPresets: next });
    saveToStorage(get().mockEnabled, next);
  },

  setEnabledPresets: (v) => {
    set({ enabledPresets: v });
    saveToStorage(get().mockEnabled, v);
  },
}));
