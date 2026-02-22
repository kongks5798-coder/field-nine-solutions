/**
 * /api/collab/sync
 *
 * GET  ?slug=<slug>          → fetch current doc content
 * POST { slug, title?, content } → upsert doc (persist latest content)
 *
 * Uses the service-role client so RLS is bypassed for server-side persistence.
 * The Supabase Realtime Broadcast channel (on the client) handles live sync;
 * this endpoint is only for durable storage (load on join + periodic save).
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

// ─── GET: load doc by slug ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  try {
    const db = getAdminClient();
    const { data, error } = await db
      .from("collab_docs")
      .select("id, slug, title, content, updated_at")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ doc: null }, { status: 200 });
    }
    return NextResponse.json({ doc: data }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST: upsert doc ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: { slug?: string; title?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { slug, title = "Untitled", content = "" } = body;
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  try {
    const db = getAdminClient();
    const { data, error } = await db
      .from("collab_docs")
      .upsert(
        { slug, title, content },
        { onConflict: "slug" }
      )
      .select("id, slug, title, content, updated_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ doc: data }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
