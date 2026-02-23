import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fieldnine.io';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // 메인
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },

    // 공개 마케팅 페이지
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },

    // 갤러리
    { url: `${BASE_URL}/gallery`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },

    // 인증
    { url: `${BASE_URL}/login`, lastModified: now, priority: 0.5 },
    { url: `${BASE_URL}/signup`, lastModified: now, priority: 0.5 },

    // 상태
    { url: `${BASE_URL}/status`, lastModified: now, changeFrequency: 'daily', priority: 0.4 },

    // 법적 고지
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
