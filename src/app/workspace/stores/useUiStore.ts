import { create } from "zustand";

interface UiState {
  editingName: boolean;
  ctxMenu: { x: number; y: number; file: string } | null;
  toast: string;
  saving: "idle" | "saving" | "saved";
  showCdnModal: boolean;
  customCdn: string;
  showEnvPanel: boolean;
  showUpgradeModal: boolean;
  showPublishModal: boolean;
  publishedUrl: string;
  publishing: boolean;
  showParams: boolean;
  showCommandPalette: boolean;
  showShortcuts: boolean;
  showOnboarding: boolean;

  setEditingName: (v: boolean) => void;
  setCtxMenu: (v: { x: number; y: number; file: string } | null) => void;
  setToast: (v: string) => void;
  showToast: (msg: string) => void;
  setSaving: (v: "idle" | "saving" | "saved") => void;
  setShowCdnModal: (v: boolean) => void;
  setCustomCdn: (v: string) => void;
  setShowEnvPanel: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowUpgradeModal: (v: boolean) => void;
  setShowPublishModal: (v: boolean) => void;
  setPublishedUrl: (v: string) => void;
  setPublishing: (v: boolean) => void;
  setShowParams: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowCommandPalette: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowShortcuts: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowOnboarding: (v: boolean) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUiStore = create<UiState>((set) => ({
  editingName: false,
  ctxMenu: null,
  toast: "",
  saving: "idle",
  showCdnModal: false,
  customCdn: "",
  showEnvPanel: false,
  showUpgradeModal: false,
  showPublishModal: false,
  publishedUrl: "",
  publishing: false,
  showParams: false,
  showCommandPalette: false,
  showShortcuts: false,
  showOnboarding: false,

  setEditingName: (v) => set({ editingName: v }),
  setCtxMenu: (v) => set({ ctxMenu: v }),
  setToast: (v) => set({ toast: v }),
  showToast: (msg) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: msg });
    toastTimer = setTimeout(() => set({ toast: "" }), 2400);
  },
  setSaving: (v) => set({ saving: v }),
  setShowCdnModal: (v) => set({ showCdnModal: v }),
  setCustomCdn: (v) => set({ customCdn: v }),
  setShowEnvPanel: (v) => set((s) => ({ showEnvPanel: typeof v === "function" ? v(s.showEnvPanel) : v })),
  setShowUpgradeModal: (v) => set({ showUpgradeModal: v }),
  setShowPublishModal: (v) => set({ showPublishModal: v }),
  setPublishedUrl: (v) => set({ publishedUrl: v }),
  setPublishing: (v) => set({ publishing: v }),
  setShowParams: (v) => set((s) => ({ showParams: typeof v === "function" ? v(s.showParams) : v })),
  setShowCommandPalette: (v) => set((s) => ({ showCommandPalette: typeof v === "function" ? v(s.showCommandPalette) : v })),
  setShowShortcuts: (v) => set((s) => ({ showShortcuts: typeof v === "function" ? v(s.showShortcuts) : v })),
  setShowOnboarding: (v) => set({ showOnboarding: v }),
}));
