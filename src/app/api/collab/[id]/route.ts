// In-memory store for collaboration sessions (resets on server restart)
// For production, would use Redis/DB but in-memory is fine for demo
import { NextRequest, NextResponse } from "next/server";

// Simple in-memory store
const sessions = new Map<string, { html: string; name: string; ts: number }>();

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessions.get(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    sessions.set(id, { html: body.html ?? "", name: body.name ?? "프로젝트", ts: Date.now() });
    // Clean old sessions (older than 2 hours)
    for (const [key, val] of sessions.entries()) {
      if (Date.now() - val.ts > 7200000) sessions.delete(key);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
