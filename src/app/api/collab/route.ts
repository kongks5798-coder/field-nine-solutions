/**
 * /api/collab
 *
 * GET  — list active collab sessions from the collab_docs table
 * POST — create or join a collab session (upsert by slug)
 *
 * Uses the service-role admin client to bypass RLS.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getAdminClient } from "@/lib/supabase-admin";

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
}

// ─── GET: list active collab sessions ────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

  try {
    const db = getAdminClient();
    const { data, error } = await db
      .from("collab_docs")
      .select("id, slug, title, content, owner_id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ sessions: data ?? [] }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST: create / join a collab session ────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { slug?: string; title?: string; content?: string; owner_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { slug, title = "Untitled", content = "", owner_id } = body;
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  try {
    const db = getAdminClient();

    // Try to find existing session first
    const { data: existing } = await db
      .from("collab_docs")
      .select("id, slug, title, content, owner_id, updated_at")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      // Session already exists — return it (join)
      return NextResponse.json({ session: existing, created: false }, { status: 200 });
    }

    // Create new session
    const insertData: Record<string, unknown> = { slug, title, content };
    if (owner_id) insertData.owner_id = owner_id;

    const { data, error } = await db
      .from("collab_docs")
      .insert(insertData)
      .select("id, slug, title, content, owner_id, updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ session: data, created: true }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
