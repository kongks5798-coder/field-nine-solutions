// Collaboration utilities for live sharing

export interface CollabSession {
  html: string;
  name: string;
  ts: number;
}

export function generateCollabId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function pushCollabUpdate(id: string, html: string, name: string): Promise<void> {
  try {
    await fetch(`/api/collab/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html, name }),
    });
  } catch { /* silent */ }
}

export async function fetchCollabSession(id: string): Promise<CollabSession | null> {
  try {
    const res = await fetch(`/api/collab/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
