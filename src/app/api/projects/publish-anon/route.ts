import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { SITE_URL } from "@/lib/constants";
import { injectDalkakBadge } from "@/lib/dalkakBadge";

// Service role client — bypasses RLS for anonymous publish
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function toSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40) || "app";
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  const suffix = Array.from(buf).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 6);
  return `${base}-${suffix}`;
}

const AnonPublishSchema = z.object({
  name: z.string().min(1).max(100).default("내 앱"),
  html: z.string().min(1).max(2_000_000),
});

// Rate limit: in-memory per IP (resets on cold start, sufficient for abuse prevention)
const ipTracker = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const tracker = ipTracker.get(ip);
  if (tracker && now < tracker.reset) {
    if (tracker.count >= RATE_LIMIT) {
      return NextResponse.json(
        { error: "배포 횟수 초과. 1시간 후 다시 시도하세요." },
        { status: 429 }
      );
    }
    tracker.count++;
  } else {
    ipTracker.set(ip, { count: 1, reset: now + RATE_WINDOW });
  }

  // Size guard
  const contentLength = parseInt(req.headers.get("content-length") ?? "0");
  if (contentLength > 2_000_000) {
    return NextResponse.json({ error: "HTML too large (max 2MB)" }, { status: 413 });
  }

  const parsed = AnonPublishSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }
  const { name, html } = parsed.data;

  const supabase = serviceClient();

  // Retry on slug collision (unique constraint 23505)
  let slug = "";
  let lastError: { code?: string; message?: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    slug = toSlug(name);
    const { error } = await supabase.from("published_apps").insert({
      slug,
      user_id: null,   // anonymous — user_id is nullable in schema
      project_id: null,
      name,
      html: injectDalkakBadge(html, slug),
      views: 0,
      updated_at: new Date().toISOString(),
    });
    if (!error) { lastError = null; break; }
    if (error.code !== "23505") { lastError = error; break; }
    lastError = error;
  }

  if (lastError) {
    return NextResponse.json(
      { error: "배포 실패: " + (lastError.message ?? "unknown") },
      { status: 500 }
    );
  }

  return NextResponse.json({
    slug,
    url: `${SITE_URL}/p/${slug}`,
    isAnon: true,
  });
}
