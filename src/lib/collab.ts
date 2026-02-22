/**
 * FieldNine — Supabase Realtime Collaboration Wrapper
 *
 * Provides typed helpers for joining broadcast channels, syncing document
 * content, broadcasting cursor positions, and tracking online presence.
 *
 * This is a client-side module (imported from "use client" pages).
 */

import { supabase } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CursorPayload {
  userId: string;
  userName: string;
  position: number;        // selectionStart offset
  color: string;
}

export interface ContentPayload {
  content: string;
  sender: string;          // unique user id for this session
  cursorPos: number;       // sender's cursor at time of edit
}

export interface PresenceMeta {
  name: string;
  color: string;
  cursor: string;          // "editing" | "viewing"
  joinedAt: string;        // ISO timestamp
}

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  initial: string;
  cursor: string;
}

export type OnContentUpdate = (payload: ContentPayload) => void;
export type OnCursorUpdate  = (payload: CursorPayload)  => void;
export type OnPresenceSync  = (users: CollabUser[])      => void;

// ─── Constants ───────────────────────────────────────────────────────────────

const PRESENCE_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f43f5e", "#14b8a6", "#eab308", "#ec4899"];

/** Generate a stable-ish session ID */
export function generateUserId(): string {
  return `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Pick a deterministic colour from the palette */
export function pickColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length];
}

// ─── Channel helpers ─────────────────────────────────────────────────────────

function isConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co"
  );
}

/**
 * Join a Supabase Realtime Broadcast channel for a given document.
 *
 * Returns the channel instance and a cleanup function.
 */
export function joinChannel(
  docId: string,
  userId: string,
  userName: string,
  callbacks: {
    onContent?: OnContentUpdate;
    onCursor?: OnCursorUpdate;
    onPresence?: OnPresenceSync;
  },
): { channel: RealtimeChannel; leave: () => void } | null {
  if (!isConfigured()) return null;

  const color = pickColor(userId);
  const channelName = `collab_doc_${docId}`;

  const channel = supabase.channel(channelName, {
    config: {
      presence: { key: userId },
      broadcast: { self: false },
    },
  });

  // ── Broadcast: document content changes ──
  if (callbacks.onContent) {
    const onContent = callbacks.onContent;
    channel.on(
      "broadcast",
      { event: "doc_content" },
      (msg: { payload: ContentPayload }) => {
        if (msg.payload.sender !== userId) {
          onContent(msg.payload);
        }
      },
    );
  }

  // ── Broadcast: cursor position updates ──
  if (callbacks.onCursor) {
    const onCursor = callbacks.onCursor;
    channel.on(
      "broadcast",
      { event: "doc_cursor" },
      (msg: { payload: CursorPayload }) => {
        if (msg.payload.userId !== userId) {
          onCursor(msg.payload);
        }
      },
    );
  }

  // ── Presence: who's online ──
  if (callbacks.onPresence) {
    const onPresence = callbacks.onPresence;
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceMeta>();
      const users: CollabUser[] = Object.entries(state).map(([key, vals]) => ({
        id: key,
        name: vals[0]?.name ?? "Anonymous",
        color: vals[0]?.color ?? pickColor(key),
        initial: (vals[0]?.name ?? "?")[0],
        cursor: vals[0]?.cursor ?? "viewing",
      }));
      onPresence(users);
    });
  }

  // Subscribe and track presence
  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({
        name: userName,
        color,
        cursor: "viewing",
        joinedAt: new Date().toISOString(),
      } satisfies PresenceMeta);
    }
  });

  const leave = () => {
    channel.untrack().catch(() => {});
    supabase.removeChannel(channel);
  };

  return { channel, leave };
}

/**
 * Broadcast a document content update to all peers.
 * Debouncing should be handled by the caller.
 */
export async function sendContentUpdate(
  channel: RealtimeChannel,
  content: string,
  sender: string,
  cursorPos: number,
): Promise<void> {
  await channel.send({
    type: "broadcast",
    event: "doc_content",
    payload: { content, sender, cursorPos } satisfies ContentPayload,
  });
}

/**
 * Broadcast current cursor position to peers.
 */
export async function sendCursorUpdate(
  channel: RealtimeChannel,
  userId: string,
  userName: string,
  position: number,
  color: string,
): Promise<void> {
  await channel.send({
    type: "broadcast",
    event: "doc_cursor",
    payload: { userId, userName, position, color } satisfies CursorPayload,
  });
}

/**
 * Update own presence metadata (e.g. cursor state changed to "editing").
 */
export async function updatePresence(
  channel: RealtimeChannel,
  meta: PresenceMeta,
): Promise<void> {
  await channel.track(meta);
}

/**
 * Leave and clean up a channel.
 */
export function leaveChannel(channel: RealtimeChannel): void {
  channel.untrack().catch(() => {});
  supabase.removeChannel(channel);
}

/**
 * Persist document content to the server via the collab/sync API.
 * This provides durable storage beyond the ephemeral broadcast.
 */
export async function persistDoc(
  slug: string,
  title: string,
  content: string,
): Promise<boolean> {
  try {
    const res = await fetch("/api/collab/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, title, content }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Load a persisted document from the collab/sync API.
 */
export async function loadDoc(
  slug: string,
): Promise<{ id: string; slug: string; title: string; content: string; updated_at: string } | null> {
  try {
    const res = await fetch(`/api/collab/sync?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.doc ?? null;
  } catch {
    return null;
  }
}
