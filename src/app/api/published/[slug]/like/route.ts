import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendLikeNotificationEmail } from "@/lib/email";

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

  // Parse optional liker info from request body (best-effort)
  let likerName = "누군가";
  let likerId: string | null = null;
  try {
    const body = (await req.json()) as { likerName?: string; likerId?: string };
    if (body.likerName) likerName = body.likerName;
    if (body.likerId) likerId = body.likerId;
  } catch {
    // Body is optional — ignore parse errors
  }

  try {
    const supabase = serviceClient();

    // Increment likes column — silently fails if column doesn't exist
    await supabase.rpc("increment_app_likes", { p_slug: slug }).then(() => {});

    // Send notification to app creator (fire-and-forget, no await on errors)
    void sendCreatorLikeNotification(supabase, slug, likerName, likerId);
  } catch {
    // Silently ignore — frontend tracks likes via localStorage
  }

  return NextResponse.json({ ok: true });
}

/** Look up the app's creator and send a throttled like notification. */
async function sendCreatorLikeNotification(
  supabase: ReturnType<typeof createServerClient>,
  slug: string,
  likerName: string,
  likerId: string | null
): Promise<void> {
  try {
    // 1. Get app name + creator user_id from published_apps
    const { data: app } = await supabase
      .from("published_apps")
      .select("name, user_id")
      .eq("slug", slug)
      .single();

    if (!app?.user_id) return;

    const creatorId = app.user_id as string;
    const appName = (app.name as string) ?? slug;

    // 2. Skip self-likes
    if (likerId && likerId === creatorId) return;

    // 3. Throttle: at most 1 notification per creator per hour
    const throttle = checkRateLimit(`like-notify:${creatorId}`, {
      limit: 1,
      windowMs: 60 * 60 * 1000,
    });
    if (!throttle.success) return;

    // 4. Look up creator email + display name from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, display_name, full_name")
      .eq("id", creatorId)
      .single();

    if (!profile?.email) return;

    const creatorName =
      (profile.display_name as string | null) ??
      (profile.full_name as string | null) ??
      "사용자";

    // 5. Send the email
    await sendLikeNotificationEmail(
      profile.email as string,
      creatorName,
      appName,
      likerName
    );
  } catch {
    // Notification is best-effort — never surface errors to the caller
  }
}
