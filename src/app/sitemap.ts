import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fieldnine.io';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // 메인
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },

    // 공개 마케팅 페이지
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },

    // 핵심 제품 페이지
    { url: `${BASE_URL}/workspace`, lastModified: now, priority: 0.8 },
    { url: `${BASE_URL}/dashboard`, lastModified: now, priority: 0.7 },
    { url: `${BASE_URL}/lab`, lastModified: now, priority: 0.7 },
    { url: `${BASE_URL}/lm`, lastModified: now, priority: 0.7 },

    // 부가 기능
    { url: `${BASE_URL}/flow`, lastModified: now, priority: 0.6 },
    { url: `${BASE_URL}/canvas`, lastModified: now, priority: 0.6 },
    { url: `${BASE_URL}/team`, lastModified: now, priority: 0.6 },
    { url: `${BASE_URL}/cloud`, lastModified: now, priority: 0.6 },
    { url: `${BASE_URL}/cowork`, lastModified: now, priority: 0.6 },
    { url: `${BASE_URL}/collab`, lastModified: now, priority: 0.6 },

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
