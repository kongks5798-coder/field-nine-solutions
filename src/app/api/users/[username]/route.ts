import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function makeServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = makeServiceClient();

  // Find user by username column or full_name match
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio, website, plan, created_at, username")
    .or(`username.eq.${username},full_name.ilike.${username}`)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
  }

  // Get published apps for this user
  const { data: apps } = await supabase
    .from("published_apps")
    .select("slug, name, description, views, likes, created_at")
    .eq("user_id", profile.id)
    .order("views", { ascending: false })
    .limit(20);

  const appList = apps ?? [];

  return NextResponse.json({
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      website: profile.website,
      plan: profile.plan,
      created_at: profile.created_at,
      username: profile.username ?? username,
    },
    apps: appList,
    stats: {
      appCount: appList.length,
      totalViews: appList.reduce((s, a) => s + (a.views ?? 0), 0),
      totalLikes: appList.reduce((s, a) => s + (a.likes ?? 0), 0),
    },
  });
}
