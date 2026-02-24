"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export interface Notification {
  id: string;
  icon: string;
  title: string;
  time: string;
  read: boolean;
}

const STORAGE_KEY = "dalkak_notifications";

function loadNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Notification[];
  } catch { /* ignore */ }
  // Default notifications for new users
  return [
    { id: "welcome", icon: "\uD83C\uDF89", title: "Dalkak\uc5d0 \uc624\uc2e0 \uac83\uc744 \ud658\uc601\ud569\ub2c8\ub2e4!", time: new Date().toISOString(), read: false },
    { id: "tip-ai", icon: "\uD83E\uDD16", title: "AI\uc5d0\uac8c \ub9d0\ud558\uae30\ub85c \uccab \uc571\uc744 \ub9cc\ub4e4\uc5b4\ubcf4\uc138\uc694", time: new Date().toISOString(), read: false },
  ];
}

function saveNotifications(items: Notification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* ignore */ }
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotifications(loadNotifications());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = useCallback(() => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  }, [notifications]);

  const markRead = useCallback((id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    saveNotifications(updated);
  }, [notifications]);

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return "\ubc29\uae08";
      if (diffMin < 60) return `${diffMin}\ubd84 \uc804`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return `${diffH}\uc2dc\uac04 \uc804`;
      const diffD = Math.floor(diffH / 24);
      return `${diffD}\uc77c \uc804`;
    } catch {
      return "";
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={`\uc54c\ub9bc ${unreadCount > 0 ? `${unreadCount}\uac1c \ubbf8\uc77d\uc74c` : "\uc5c6\uc74c"}`}
        aria-expanded={open}
        style={{
          position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 36, height: 36, borderRadius: 8,
          border: "1px solid #e5e7eb", background: open ? "#fff7ed" : "transparent",
          fontSize: 18, cursor: "pointer", flexShrink: 0,
          transition: "background 0.15s",
        }}
      >
        {"\uD83D\uDD14"}
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            minWidth: 18, height: 18, borderRadius: 9,
            background: "#f43f5e", color: "#fff",
            fontSize: 10, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
            border: "2px solid #fff",
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 320, maxHeight: 400, overflowY: "auto",
          background: "#fff", border: "1px solid #e5e7eb",
          borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
          zIndex: 200, animation: "scaleIn 0.15s ease-out",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px 10px", borderBottom: "1px solid #f0f0f0",
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#1b1b1f" }}>\uc54c\ub9bc</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: 12, color: "#f97316", background: "none",
                  border: "none", cursor: "pointer", fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                \ubaa8\ub450 \uc77d\uc74c
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
              \uc54c\ub9bc\uc774 \uc5c6\uc2b5\ub2c8\ub2e4
            </div>
          ) : (
            <div>
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "12px 16px",
                    background: n.read ? "transparent" : "rgba(249,115,22,0.04)",
                    borderBottom: "1px solid #f5f5f5",
                    cursor: "pointer", transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#f9fafb"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = n.read ? "transparent" : "rgba(249,115,22,0.04)"; }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{n.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: n.read ? 500 : 700,
                      color: n.read ? "#6b7280" : "#1b1b1f",
                      lineHeight: 1.4,
                    }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                      {formatTime(n.time)}
                    </div>
                  </div>
                  {!n.read && (
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: "#f97316", flexShrink: 0, marginTop: 4,
                    }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
