"use client";

/**
 * useCollaboration — thin hook that wraps the collab/ infrastructure
 * (CollabProvider + MonacoBinding + collabSessionHolder) and exposes a
 * clean, composable API for page.tsx or any future consumer.
 *
 * Lifecycle:
 *   1. connect(roomId, username)  → creates Y.Doc + WebrtcProvider
 *   2. bindEditor(editor, fileKey) → binds a Monaco instance to Y.Text
 *   3. disconnect()              → destroys provider + all bindings
 *
 * Peer list is derived from awareness and refreshed on every awareness change.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import * as Y from "yjs";
import {
  createCollabSession,
  randomUserColor,
} from "../collab/CollabProvider";
import type { CollabSession } from "../collab/CollabProvider";
import { bindMonacoToYjs } from "../collab/MonacoBinding";
import {
  setCollabSession,
  getCollabSession,
} from "../collab/collabSessionHolder";
import { injectAwarenessCss, removeAwarenessCss } from "../collab/AwarenessCursors";
import { useCollabStore } from "../stores";
import type * as Monaco from "monaco-editor";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface CollabUser {
  name: string;
  color: string;
  clientId: number;
}

export interface UseCollaborationReturn {
  /** True while the WebRTC provider considers itself connected */
  isConnected: boolean;
  /** List of all currently-aware peers (including local user) */
  peers: CollabUser[];
  /** Start a collaboration session */
  connect: (roomId: string, username: string) => Promise<void>;
  /** End the session and clean up all bindings */
  disconnect: () => void;
  /**
   * Bind a Monaco editor instance to a specific file's Y.Text.
   * Must be called after connect().
   * Returns a cleanup function — call it on editor unmount or file switch.
   */
  bindEditor: (
    editor: Monaco.editor.IStandaloneCodeEditor,
    fileKey: string,
  ) => Promise<() => void>;
}

// ─── Color palette (same as CollabProvider) ──────────────────────────────────

const COLORS = [
  "#f97316", "#8b5cf6", "#06b6d4", "#10b981",
  "#ec4899", "#f59e0b", "#3b82f6", "#ef4444",
];

function pickColor(index: number): string {
  return COLORS[index % COLORS.length];
}

// ─── Hook implementation ──────────────────────────────────────────────────────

export function useCollaboration(): UseCollaborationReturn {
  const sessionRef = useRef<CollabSession | null>(null);
  /** Map from fileKey → MonacoBinding cleanup fn */
  const bindingsRef = useRef<Map<string, () => void>>(new Map());

  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState<CollabUser[]>([]);

  // Mirror connection state into the global Zustand store so CollabPanel
  // and other components can react without prop-drilling.
  const { startCollab, stopCollab, setConnectedPeers } = useCollabStore.getState();

  // ── Awareness → peers list ──────────────────────────────────────────────
  const updatePeers = useCallback((awareness: CollabSession["awareness"]) => {
    const states = awareness.getStates() as Map<
      number,
      { user?: { name?: string; color?: string } }
    >;
    const list: CollabUser[] = [];
    let idx = 0;
    states.forEach((state, clientId) => {
      list.push({
        clientId,
        name: state.user?.name ?? `User ${clientId}`,
        color: state.user?.color ?? pickColor(idx),
      });
      idx++;
    });
    setPeers(list);
    setConnectedPeers(list.length);
  }, [setConnectedPeers]);

  // ── connect ─────────────────────────────────────────────────────────────
  const connect = useCallback(
    async (roomId: string, username: string) => {
      // Disconnect any existing session first
      if (sessionRef.current) {
        sessionRef.current.destroy();
        sessionRef.current = null;
        setCollabSession(null);
      }

      const color = randomUserColor();

      try {
        const session = await createCollabSession(roomId, username, color);
        sessionRef.current = session;
        setCollabSession(session);

        // Inject cursor CSS
        injectAwarenessCss();

        // Track awareness changes
        const onAwarenessChange = () => updatePeers(session.awareness);
        session.awareness.on("change", onAwarenessChange);
        // Initial peer snapshot
        updatePeers(session.awareness);

        // Reflect in Zustand
        startCollab(roomId);
        setIsConnected(true);
      } catch (err) {
        console.error("[useCollaboration] connect failed:", err);
        throw err;
      }
    },
    [updatePeers, startCollab],
  );

  // ── disconnect ───────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    // Destroy all Monaco bindings
    bindingsRef.current.forEach((cleanup) => cleanup());
    bindingsRef.current.clear();

    // Destroy Yjs session
    if (sessionRef.current) {
      sessionRef.current.destroy();
      sessionRef.current = null;
    }
    setCollabSession(null);

    // Remove cursor CSS
    removeAwarenessCss();

    // Reflect in Zustand
    stopCollab();
    setIsConnected(false);
    setPeers([]);
  }, [stopCollab]);

  // ── bindEditor ───────────────────────────────────────────────────────────
  const bindEditor = useCallback(
    async (
      editor: Monaco.editor.IStandaloneCodeEditor,
      fileKey: string,
    ): Promise<() => void> => {
      const session = sessionRef.current ?? getCollabSession();
      if (!session) {
        console.warn("[useCollaboration] bindEditor called before connect()");
        return () => {};
      }

      // Destroy any previous binding for this file key
      const existing = bindingsRef.current.get(fileKey);
      if (existing) {
        existing();
        bindingsRef.current.delete(fileKey);
      }

      const yText: Y.Text = session.doc.getText(fileKey);

      // Seed Y.Text with the editor's current content if it is empty
      if (yText.length === 0) {
        const model = editor.getModel();
        if (model) {
          yText.insert(0, model.getValue());
        }
      }

      try {
        const binding = await bindMonacoToYjs(editor, yText, session.awareness);
        const cleanup = () => binding.destroy();
        bindingsRef.current.set(fileKey, cleanup);
        return cleanup;
      } catch (err) {
        console.error("[useCollaboration] bindEditor failed:", err);
        return () => {};
      }
    },
    [],
  );

  // ── Auto-cleanup on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      bindingsRef.current.forEach((cleanup) => cleanup());
      bindingsRef.current.clear();
    };
  }, []);

  return { isConnected, peers, connect, disconnect, bindEditor };
}
