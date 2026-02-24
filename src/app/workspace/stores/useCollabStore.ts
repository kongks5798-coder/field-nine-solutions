import { create } from "zustand";

interface CollabState {
  /** Whether collaboration mode is currently active */
  isCollabActive: boolean;
  /** Current room ID for the collaboration session */
  roomId: string | null;
  /** Number of connected peers (including self) */
  connectedPeers: number;
  /** Local user display name */
  userName: string;
  /** Local user cursor color */
  userColor: string;

  // Actions
  startCollab: (roomId: string) => void;
  stopCollab: () => void;
  setConnectedPeers: (n: number) => void;
  setUserName: (name: string) => void;
  setUserColor: (color: string) => void;
}

export const useCollabStore = create<CollabState>((set) => ({
  isCollabActive: false,
  roomId: null,
  connectedPeers: 0,
  userName: "",
  userColor: "",

  startCollab: (roomId: string) =>
    set({ isCollabActive: true, roomId }),

  stopCollab: () =>
    set({ isCollabActive: false, roomId: null, connectedPeers: 0 }),

  setConnectedPeers: (n: number) =>
    set({ connectedPeers: n }),

  setUserName: (name: string) =>
    set({ userName: name }),

  setUserColor: (color: string) =>
    set({ userColor: color }),
}));
