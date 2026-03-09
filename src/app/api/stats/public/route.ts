import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

const FALLBACK = { apps: 1240, users: 3180, views: 89400 };

export const revalidate = 300; // 5 min ISR cache

export async function GET() {
  try {
    const admin = getAdminClient();

    const [appsRes, usersRes, viewsRes] = await Promise.all([
      admin.from("published_apps").select("*", { count: "exact", head: true }),
      admin.from("profiles").select("*", { count: "exact", head: true }),
      admin.from("published_apps").select("views"),
    ]);

    if (appsRes.error || usersRes.error || viewsRes.error) {
      return NextResponse.json(FALLBACK, {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    }

    const totalViews = (viewsRes.data ?? []).reduce(
      (sum: number, row: { views: number }) => sum + (row.views ?? 0),
      0
    );

    const stats = {
      apps: appsRes.count ?? FALLBACK.apps,
      users: usersRes.count ?? FALLBACK.users,
      views: totalViews || FALLBACK.views,
    };

    return NextResponse.json(stats, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return NextResponse.json(FALLBACK, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  }
}
