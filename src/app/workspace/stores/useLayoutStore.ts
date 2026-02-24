import { create } from "zustand";
import type { LeftTab, PreviewWidth } from "../workspace.constants";

interface LayoutState {
  leftTab: LeftTab;
  leftW: number;
  rightW: number;
  consoleH: number;
  showConsole: boolean;
  isFullPreview: boolean;
  previewWidth: PreviewWidth;
  deviceFrame: { width: number; height: number; label: string } | null;
  isMobile: boolean;
  mobilePanel: "ai" | "preview";
  draggingLeft: boolean;
  draggingRight: boolean;
  draggingConsole: boolean;

  // Terminal (Phase 2)
  showTerminal: boolean;
  terminalH: number;
  bottomTab: "console" | "terminal";

  setLeftTab: (v: LeftTab) => void;
  setLeftW: (v: number | ((prev: number) => number)) => void;
  setRightW: (v: number | ((prev: number) => number)) => void;
  setConsoleH: (v: number | ((prev: number) => number)) => void;
  setShowConsole: (v: boolean) => void;
  setIsFullPreview: (v: boolean) => void;
  setPreviewWidth: (v: PreviewWidth) => void;
  setDeviceFrame: (v: { width: number; height: number; label: string } | null) => void;
  setIsMobile: (v: boolean) => void;
  setMobilePanel: (v: "ai" | "preview") => void;
  setDraggingLeft: (v: boolean) => void;
  setDraggingRight: (v: boolean) => void;
  setDraggingConsole: (v: boolean) => void;
  setShowTerminal: (v: boolean) => void;
  setTerminalH: (v: number | ((prev: number) => number)) => void;
  setBottomTab: (v: "console" | "terminal") => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  leftTab: "ai",
  leftW: 265,
  rightW: 440,
  consoleH: 130,
  showConsole: true,
  isFullPreview: false,
  previewWidth: "full",
  deviceFrame: null,
  isMobile: false,
  mobilePanel: "ai",
  draggingLeft: false,
  draggingRight: false,
  draggingConsole: false,

  showTerminal: false,
  terminalH: 200,
  bottomTab: "console",

  setLeftTab: (v) => set({ leftTab: v }),
  setLeftW: (v) => set((s) => ({ leftW: typeof v === "function" ? v(s.leftW) : v })),
  setRightW: (v) => set((s) => ({ rightW: typeof v === "function" ? v(s.rightW) : v })),
  setConsoleH: (v) => set((s) => ({ consoleH: typeof v === "function" ? v(s.consoleH) : v })),
  setShowConsole: (v) => set({ showConsole: v }),
  setIsFullPreview: (v) => set({ isFullPreview: v }),
  setPreviewWidth: (v) => set({ previewWidth: v }),
  setDeviceFrame: (v) => set({ deviceFrame: v }),
  setIsMobile: (v) => set({ isMobile: v }),
  setMobilePanel: (v) => set({ mobilePanel: v }),
  setDraggingLeft: (v) => set({ draggingLeft: v }),
  setDraggingRight: (v) => set({ draggingRight: v }),
  setDraggingConsole: (v) => set({ draggingConsole: v }),
  setShowTerminal: (v) => set({ showTerminal: v }),
  setTerminalH: (v) => set((s) => ({ terminalH: typeof v === "function" ? v(s.terminalH) : v })),
  setBottomTab: (v) => set({ bottomTab: v }),
}));
