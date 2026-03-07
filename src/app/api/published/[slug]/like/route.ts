import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkRateLimit } from "@/lib/rate-limit";

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// POST /api/published/[slug]/like — increment likes count (best-effort)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { slug } = await params;

  // Rate limit: 10 likes per IP per hour per slug
  const rl = checkRateLimit(`like:${ip}:${slug}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  try {
    const supabase = serviceClient();
    // Increment likes column — silently fails if column doesn't exist
    await supabase.rpc("increment_app_likes", { p_slug: slug }).then(() => {});
  } catch {
    // Silently ignore — frontend tracks likes via localStorage
  }

  return NextResponse.json({ ok: true });
}
