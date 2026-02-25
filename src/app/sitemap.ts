import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

const BASE_URL = SITE_URL;

/** Try to fetch published gallery slugs for dynamic sitemap entries */
async function fetchGallerySlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/published?limit=100&sort=views`, {
      next: { revalidate: 3600 }, // cache for 1 hour
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((app: { slug: string; updated_at?: string }) => ({
      slug: app.slug,
      updatedAt: app.updated_at ?? new Date().toISOString(),
    }));
  } catch {
    // Supabase or network may not be available during build
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static pages ──────────────────────────────────────────────────────────
  const staticEntries: MetadataRoute.Sitemap = [
    // 메인
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },

    // 공개 마케팅 페이지
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },

    // 갤러리
    { url: `${BASE_URL}/gallery`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },

    // 주요 앱 페이지
    { url: `${BASE_URL}/workspace`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/dashboard`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/analytics`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/cloud`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/team`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/cowork`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/collab`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/canvas`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/flow`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/lab`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/lm`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/docs`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/changelog`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },

    // 인증
    { url: `${BASE_URL}/login`, lastModified: now, priority: 0.5 },
    { url: `${BASE_URL}/signup`, lastModified: now, priority: 0.5 },

    // 상태
    { url: `${BASE_URL}/status`, lastModified: now, changeFrequency: 'daily', priority: 0.4 },

    // 법적 고지
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // ── Dynamic gallery entries ───────────────────────────────────────────────
  const gallerySlugs = await fetchGallerySlugs();
  const galleryEntries: MetadataRoute.Sitemap = gallerySlugs.map(({ slug, updatedAt }) => ({
    url: `${BASE_URL}/p/${slug}`,
    lastModified: new Date(updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...staticEntries, ...galleryEntries];
}
