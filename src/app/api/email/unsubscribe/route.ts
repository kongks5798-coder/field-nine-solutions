import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/unsubscribeToken";
import { checkLimit, ipFromHeaders, headersFor } from "@/core/rateLimit";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

async function updatePreferences(userId: string, type: "marketing" | "all") {
  const supabase = getSupabase();

  if (type === "all") {
    const { error } = await supabase
      .from("profiles")
      .update({
        email_preferences: { marketing: false },
      })
      .eq("id", userId);
    if (error) throw error;
  } else {
    // Use rpc for atomic jsonb_set update
    const { error } = await supabase.rpc("set_email_preference", {
      p_user_id: userId,
      p_key: type,
      p_value: false,
    });
    if (error) {
      // Fallback: direct update if rpc not available
      const { data: existing } = await supabase
        .from("profiles")
        .select("email_preferences")
        .eq("id", userId)
        .single();
      const prefs = (existing?.email_preferences as Record<string, boolean> | null) ?? {};
      prefs[type] = false;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ email_preferences: prefs })
        .eq("id", userId);
      if (updateError) throw updateError;
    }
  }
}

// GET /api/email/unsubscribe?token=xxx
// Verifies token, updates preferences, redirects to /unsubscribe?success=true
export async function GET(req: NextRequest) {
  const ip = ipFromHeaders(req.headers);
  const rl = checkLimit(`unsubscribe:${ip}`, 10, 60_000);
  const rlHeaders = headersFor(rl);

  if (!rl.ok) {
    return new NextResponse("Too Many Requests", { status: 429, headers: rlHeaders });
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribe?error=missing_token", req.url));
  }

  const payload = await verifyUnsubscribeToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/unsubscribe?error=invalid_token", req.url));
  }

  try {
    await updatePreferences(payload.userId, payload.type);
  } catch {
    return NextResponse.redirect(new URL("/unsubscribe?error=server_error", req.url));
  }

  return NextResponse.redirect(
    new URL(`/unsubscribe?success=true&type=${payload.type}`, req.url),
    { headers: rlHeaders }
  );
}

// POST /api/email/unsubscribe
// Body: { token: string, type: 'marketing' | 'all' }
export async function POST(req: NextRequest) {
  const ip = ipFromHeaders(req.headers);
  const rl = checkLimit(`unsubscribe:${ip}`, 10, 60_000);
  const rlHeaders = headersFor(rl);

  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rlHeaders });
  }

  let body: { token?: unknown; type?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token, type } = body;

  if (typeof token !== "string") {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  if (type !== "marketing" && type !== "all") {
    return NextResponse.json({ error: "type must be 'marketing' or 'all'" }, { status: 400 });
  }

  const payload = await verifyUnsubscribeToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  // Respect the requested type but never allow billing unsubscribe
  const effectiveType = type === "all" ? "all" : "marketing";

  try {
    await updatePreferences(payload.userId, effectiveType);
  } catch (err) {
    console.error("[unsubscribe] DB update failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true, type: effectiveType }, { headers: rlHeaders });
}
