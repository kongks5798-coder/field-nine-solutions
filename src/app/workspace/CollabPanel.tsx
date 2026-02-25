"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { T } from "./workspace.constants";
import { useCollabStore, useFileSystemStore } from "./stores";
import {
  createCollabSession,
  generateRoomId,
  randomUserColor,
} from "./collab/CollabProvider";
import type { CollabSession } from "./collab/CollabProvider";
import { setCollabSession } from "./collab/collabSessionHolder";
import { injectAwarenessCss, removeAwarenessCss } from "./collab/AwarenessCursors";

interface CollabPanelProps {
  onShowToast: (msg: string) => void;
}

export function CollabPanel({ onShowToast }: CollabPanelProps) {
  const {
    isCollabActive,
    roomId,
    connectedPeers,
    userName,
    userColor,
    startCollab,
    stopCollab,
    setConnectedPeers,
    setUserName,
    setUserColor,
  } = useCollabStore();

  const files = useFileSystemStore((s) => s.files);
  const updateFileContent = useFileSystemStore((s) => s.updateFileContent);

  const [inputRoomId, setInputRoomId] = useState("");
  const [inputName, setInputName] = useState("");
  const sessionRef = useRef<CollabSession | null>(null);
  const syncListenersRef = useRef<(() => void)[]>([]);

  // Initialize user name and color on first render
  useEffect(() => {
    if (!userName) {
      const saved = typeof localStorage !== "undefined"
        ? localStorage.getItem("f9_collab_name")
        : null;
      setUserName(saved || `User-${Math.floor(Math.random() * 1000)}`);
    }
    if (!userColor) {
      const saved = typeof localStorage !== "undefined"
        ? localStorage.getItem("f9_collab_color")
        : null;
      setUserColor(saved || randomUserColor());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync inputName with store
  useEffect(() => {
    if (userName) setInputName(userName);
  }, [userName]);

  const handleStartCollab = useCallback(
    async (rid?: string) => {
      const room = rid || inputRoomId.trim() || generateRoomId();

      // Save user preferences
      const name = inputName.trim() || userName;
      const color = userColor || randomUserColor();
      setUserName(name);
      setUserColor(color);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("f9_collab_name", name);
        localStorage.setItem("f9_collab_color", color);
      }

      try {
        const session = await createCollabSession(room, name, color);
        sessionRef.current = session;
        setCollabSession(session);

        // Initialize yDoc with current files
        const filesData = files;
        for (const [filename, fileNode] of Object.entries(filesData)) {
          const yText = session.doc.getText(filename);
          if (yText.length === 0 && fileNode.content) {
            yText.insert(0, fileNode.content);
          }
        }

        // Listen for yDoc changes and sync back to file system store
        const cleanupFns: (() => void)[] = [];
        for (const filename of Object.keys(filesData)) {
          const yText = session.doc.getText(filename);
          const observer = () => {
            const newContent = yText.toString();
            const current = useFileSystemStore.getState().files[filename];
            if (current && current.content !== newContent) {
              updateFileContent(filename, newContent);
            }
          };
          yText.observe(observer);
          cleanupFns.push(() => yText.unobserve(observer));
        }
        syncListenersRef.current = cleanupFns;

        // Track peer count via awareness
        const updatePeers = () => {
          const states = session.awareness.getStates();
          setConnectedPeers(states.size);
        };
        session.awareness.on("change", updatePeers);
        updatePeers();

        // Inject remote cursor CSS
        injectAwarenessCss();

        startCollab(room);
        onShowToast(`Collaboration started: ${room}`);
      } catch (err) {
        console.error("Failed to start collaboration:", err);
        onShowToast("Failed to start collaboration session");
      }
    },
    [inputRoomId, inputName, userName, userColor, files, startCollab, setUserName, setUserColor, setConnectedPeers, updateFileContent, onShowToast],
  );

  const handleStopCollab = useCallback(() => {
    // Clean up yText observers
    for (const cleanup of syncListenersRef.current) {
      cleanup();
    }
    syncListenersRef.current = [];

    // Destroy session
    if (sessionRef.current) {
      sessionRef.current.destroy();
      sessionRef.current = null;
    }
    setCollabSession(null);

    // Remove cursor CSS
    removeAwarenessCss();

    stopCollab();
    onShowToast("Collaboration ended");
  }, [stopCollab, onShowToast]);

  const handleCopyLink = useCallback(() => {
    if (!roomId) return;
    const url = `${window.location.origin}/workspace?collab=${encodeURIComponent(roomId)}`;
    navigator.clipboard
      .writeText(url)
      .then(() => onShowToast("Link copied"))
      .catch(() => onShowToast("Failed to copy link"));
  }, [roomId, onShowToast]);

  const handleNewRoom = useCallback(() => {
    setInputRoomId(generateRoomId());
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 40,
        right: 12,
        zIndex: 600,
        width: 320,
        background: T.surface,
        border: `1px solid ${T.borderHi}`,
        borderRadius: 14,
        boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke={isCollabActive ? T.green : T.muted}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="6" cy="6" r="3" />
          <circle cx="10" cy="10" r="3" />
        </svg>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text, flex: 1 }}>
          Real-time Collaboration
        </span>
        {isCollabActive && (
          <span
            style={{
              fontSize: 10, fontWeight: 700, color: T.green,
              background: "rgba(34,197,94,0.12)", padding: "2px 8px", borderRadius: 6,
            }}
          >
            LIVE
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px" }}>
        {!isCollabActive ? (
          <>
            {/* User name */}
            <label style={{ display: "block", fontSize: 11, color: T.muted, marginBottom: 4, fontWeight: 600 }}>
              Display Name
            </label>
            <input
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Your name"
              style={{
                width: "100%", padding: "8px 10px", fontSize: 12,
                background: "#f3f4f6", border: `1px solid ${T.border}`,
                borderRadius: 8, color: T.text, outline: "none", marginBottom: 12,
                fontFamily: "inherit", boxSizing: "border-box",
              }}
            />

            {/* User color */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>Cursor Color</label>
              <input
                type="color"
                value={userColor || "#f97316"}
                onChange={(e) => setUserColor(e.target.value)}
                style={{ width: 24, height: 24, border: "none", borderRadius: 6, cursor: "pointer", background: "none", padding: 0 }}
              />
              <button
                onClick={() => setUserColor(randomUserColor())}
                style={{ fontSize: 10, color: T.muted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}
              >
                Random
              </button>
            </div>

            {/* Room ID */}
            <label style={{ display: "block", fontSize: 11, color: T.muted, marginBottom: 4, fontWeight: 600 }}>
              Room ID
            </label>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              <input
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                placeholder="Enter or generate room ID"
                style={{
                  flex: 1, padding: "8px 10px", fontSize: 12,
                  background: "#f3f4f6", border: `1px solid ${T.border}`,
                  borderRadius: 8, color: T.text, outline: "none",
                  fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={handleNewRoom}
                title="Generate new room ID"
                style={{
                  padding: "8px 10px", background: "#f3f4f6",
                  border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted,
                  cursor: "pointer", fontSize: 14, lineHeight: 1, fontFamily: "inherit",
                }}
              >
                {"\u{1F3B2}"}
              </button>
            </div>

            {/* Start button */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => handleStartCollab()}
                style={{
                  flex: 1, padding: "10px 14px",
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentB})`,
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit", transition: "transform 0.1s",
                }}
              >
                {inputRoomId.trim() ? "Join Room" : "Create Room"}
              </button>
            </div>

            {/* Info */}
            <div style={{
              marginTop: 12, padding: "8px 10px",
              background: "#fafafa", border: `1px solid ${T.border}`,
              borderRadius: 8, fontSize: 10, color: T.muted, lineHeight: 1.6,
            }}>
              P2P WebRTC connection. No server needed. Share the room ID with collaborators.
            </div>
          </>
        ) : (
          <>
            {/* Active session info */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
              padding: "10px 12px", background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", background: T.green,
                animation: "pulse 2s infinite",
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>
                  Room: {roomId}
                </div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                  {connectedPeers} peer{connectedPeers !== 1 ? "s" : ""} connected
                </div>
              </div>
            </div>

            {/* User info */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 12, color: T.text }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: userColor, flexShrink: 0 }} />
              <span style={{ fontWeight: 600 }}>{userName}</span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button
                onClick={handleCopyLink}
                style={{
                  flex: 1, padding: "8px 12px", background: "#f3f4f6",
                  border: `1px solid ${T.border}`, borderRadius: 8, color: T.text,
                  fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2H14V6" /><path d="M14 2L7 9" /><path d="M12 9V14H2V4H7" />
                </svg>
                Copy Link
              </button>
              <button
                onClick={handleStopCollab}
                style={{
                  flex: 1, padding: "8px 12px", background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.25)", borderRadius: 8,
                  color: T.red, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Leave Session
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
