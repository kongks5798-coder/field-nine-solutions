// GET /api/showcase/featured
// Returns top 5 apps by quality_scores.score (joined with published_apps)
// Falls back to top by views if quality_scores table empty
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export const revalidate = 300; // 5 min cache

export async function GET() {
  const supabase = serviceClient();

  // Try quality_scores join first
  const { data: scored } = await supabase
    .from("quality_scores")
    .select("app_name, score, pipeline_type, user_id, created_at")
    .gte("score", 80)
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  // Get published apps for context
  const { data: apps } = await supabase
    .from("published_apps")
    .select("slug, name, views, likes, created_at")
    .order("views", { ascending: false })
    .limit(20);

  if (!apps || apps.length === 0) {
    return NextResponse.json({ featured: [] });
  }

  // If we have quality scores, enrich; otherwise fallback to top-viewed
  let featured: Array<{ slug: string; name: string; views: number; likes: number; score: number | null; badge: string }>;

  if (scored && scored.length > 0) {
    // Match scored apps to published apps by name similarity
    featured = scored.slice(0, 5).map(s => {
      const match = apps.find(a =>
        a.name === s.app_name ||
        a.name.toLowerCase().includes(s.app_name.toLowerCase().slice(0, 8))
      ) ?? apps[0];
      return {
        slug: match.slug,
        name: match.name,
        views: match.views ?? 0,
        likes: match.likes ?? 0,
        score: s.score,
        badge: s.score >= 90 ? "⭐ 최고" : s.score >= 85 ? "🔥 인기" : "✨ 추천",
      };
    });
  } else {
    featured = apps.slice(0, 5).map((a, i) => ({
      slug: a.slug,
      name: a.name,
      views: a.views ?? 0,
      likes: a.likes ?? 0,
      score: null,
      badge: i === 0 ? "🏆 1위" : i === 1 ? "🥈 2위" : i === 2 ? "🥉 3위" : "🔥 인기",
    }));
  }

  return NextResponse.json({ featured });
}
