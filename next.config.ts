import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material", "recharts", "lucide-react"],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://js.tosspayments.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' blob: data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://api.tosspayments.com",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        // 모든 경로에 보안 헤더 적용 (Lighthouse Security + Best Practices)
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy",   value: csp },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",           value: "SAMEORIGIN" },
          { key: "X-XSS-Protection",          value: "1; mode=block" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      {
        // sw.js는 절대 캐싱하지 않음 (구버전 SW 고착 방지)
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, max-age=0, must-revalidate" },
        ],
      },
      {
        // Next.js 콘텐츠 해시 에셋만 immutable 캐싱 (sw.js 제외)
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/((?!_next/static|_next/image|favicon).*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,            // 빌드 로그에 Sentry 출력 숨김
  sourcemaps: { disable: true }, // 소스맵 업로드 비활성화 (SENTRY_AUTH_TOKEN 없을 때)
  tunnelRoute: "/monitoring-tunnel", // Ad-blocker 우회 터널
});
