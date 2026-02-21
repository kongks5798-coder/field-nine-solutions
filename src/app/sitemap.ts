import { MetadataRoute } from "next";
import { createServerClient } from "@supabase/ssr";

async function getPublishedSlugs(): Promise<string[]> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
    const { data } = await supabase
      .from("published_apps")
      .select("slug")
      .order("views", { ascending: false })
      .limit(100);
    return (data ?? []).map((r: { slug: string }) => r.slug);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://fieldnine.io";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base,                lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/workspace`, lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/pricing`,   lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/gallery`,   lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/login`,     lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/signup`,    lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/terms`,     lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/privacy`,   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];

  const slugs = await getPublishedSlugs();
  const dynamicPages: MetadataRoute.Sitemap = slugs.map(slug => ({
    url: `${base}/p/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...dynamicPages];
}
