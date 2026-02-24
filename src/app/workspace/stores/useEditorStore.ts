import { create } from "zustand";

interface EditorState {
  monacoLoaded: boolean;
  splitMode: boolean;
  splitFile: string;
  cursorLine: number;
  cursorCol: number;

  setMonacoLoaded: (v: boolean) => void;
  setSplitMode: (v: boolean | ((prev: boolean) => boolean)) => void;
  setSplitFile: (v: string) => void;
  setCursorLine: (v: number) => void;
  setCursorCol: (v: number) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  monacoLoaded: false,
  splitMode: false,
  splitFile: "",
  cursorLine: 1,
  cursorCol: 1,

  setMonacoLoaded: (v) => set({ monacoLoaded: v }),
  setSplitMode: (v) => set((s) => ({ splitMode: typeof v === "function" ? v(s.splitMode) : v })),
  setSplitFile: (v) => set({ splitFile: v }),
  setCursorLine: (v) => set({ cursorLine: v }),
  setCursorCol: (v) => set({ cursorCol: v }),
}));
