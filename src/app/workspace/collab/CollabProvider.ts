import * as Y from "yjs";

// WebrtcProvider is loaded dynamically to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebrtcProviderType = any;

export interface CollabSession {
  doc: Y.Doc;
  provider: WebrtcProviderType;
  awareness: WebrtcProviderType;
  destroy: () => void;
}

const USER_COLORS = [
  "#f97316", "#3b82f6", "#10b981", "#8b5cf6",
  "#ef4444", "#06b6d4", "#f59e0b", "#ec4899",
  "#14b8a6", "#6366f1", "#84cc16", "#e11d48",
];

/** Generate a random user color from a curated palette */
export function randomUserColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

/** Generate a random room ID */
export function generateRoomId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "f9-";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/**
 * Create a collaboration session using WebRTC P2P.
 * Uses the public Yjs signaling server for peer discovery.
 * Must be called on the client only (dynamic import of y-webrtc).
 */
export async function createCollabSession(
  roomId: string,
  userName: string,
  userColor: string,
): Promise<CollabSession> {
  // Dynamic import to prevent SSR bundling
  const { WebrtcProvider } = await import("y-webrtc");

  const doc = new Y.Doc();

  const provider = new WebrtcProvider(roomId, doc, {
    signaling: ["wss://signaling.yjs.dev"],
  });

  // Set local awareness state with user info
  provider.awareness.setLocalStateField("user", {
    name: userName,
    color: userColor,
  });

  const destroy = () => {
    provider.destroy();
    doc.destroy();
  };

  return {
    doc,
    provider,
    awareness: provider.awareness,
    destroy,
  };
}
